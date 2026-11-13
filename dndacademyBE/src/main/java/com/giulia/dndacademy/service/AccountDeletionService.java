package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.DeleteAccountRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.repository.*;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class AccountDeletionService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final AvatarCleanupRepository avatarTasks;
    private final EntityManager entityManager;

    public record Successor(Long id, String username) {}
    public record DeletionPlan(long campaigns, long npcs, List<Successor> successors) {}

    @Transactional(readOnly = true)
    public DeletionPlan plan(Long id) {
        if (!users.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato");
        long campaigns = count("campaigns", "master_id", id);
        long npcs = count("npcs", "owner_id", id);
        List<Successor> successors = campaigns + npcs == 0 ? List.of() : entityManager
                .createQuery("select u from User u where u.role = :role and u.id <> :id order by u.username", User.class)
                .setParameter("role", Role.MASTER).setParameter("id", id).getResultList().stream()
                .map(user -> new Successor(user.getId(), user.getUsername())).toList();
        return new DeletionPlan(campaigns, npcs, successors);
    }

    @Transactional
    public void delete(Long userId, DeleteAccountRequest request) {
        var locked = entityManager.createQuery("select u from User u where u.id = :id or u.id = :successor order by u.id", User.class)
                .setParameter("id", userId).setParameter("successor", request.successorMasterId() == null ? -1L : request.successorMasterId())
                .setLockMode(LockModeType.PESSIMISTIC_WRITE).getResultList();
        User user = locked.stream().filter(u -> u.getId().equals(userId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
        if (!request.confirmed()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conferma la cancellazione definitiva dell account");
        if (!passwords.matches(request.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password attuale non corretta");
        }
        if (hasContents(userId)) {
            var successor = locked.stream().filter(u -> !u.getId().equals(userId)
                    && u.getId().equals(request.successorMasterId()) && u.getRole() == Role.MASTER).findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                            "Scegli un altro Master a cui trasferire i contenuti prima di eliminare l account. Se necessario, promuovi prima un altro utente."));
            for (String sql : List.of("update campaigns set master_id = :successor where master_id = :id",
                    "update npcs set owner_id = :successor where owner_id = :id")) {
                entityManager.createNativeQuery(sql).setParameter("successor", successor.getId()).setParameter("id", userId).executeUpdate();
            }
        }

        var avatar = new AvatarCleanup();
        avatar.setId(UUID.randomUUID().toString());
        avatar.setUserId(userId);
        avatar.setNextAttemptAt(Instant.now());
        avatarTasks.saveAndFlush(avatar);

        for (String table : List.of("combat_events", "combat_turn_order", "combat_participants")) {
            execute("delete from " + table + " where combat_id in (select id from combat where user_id = :id)", userId);
        }
        execute("delete from combat where user_id = :id", userId);
        execute("delete from character_stats where character_id in (select id from characters where player_id = :id)", userId);
        execute("delete from characters where player_id = :id", userId);
        for (String table : List.of("campaign_players", "campaign_chapter_progress", "campaign_progress", "user_badges",
                "user_lesson_progress", "user_quiz_results", "password_reset_tokens", "email_outbox")) {
            execute("delete from " + table + " where user_id = :id", userId);
        }
        execute("delete from users where id = :id", userId);
        entityManager.clear();
    }

    private boolean hasContents(Long userId) {
        return count("campaigns", "master_id", userId) + count("npcs", "owner_id", userId) > 0;
    }

    private long count(String table, String column, Long id) {
        return ((Number) entityManager.createNativeQuery("select count(*) from " + table + " where " + column + " = :id")
                .setParameter("id", id).getSingleResult()).longValue();
    }

    private void execute(String sql, Long id) {
        entityManager.createNativeQuery(sql).setParameter("id", id).executeUpdate();
    }
}
