package com.giulia.dndacademy.mail;

import com.giulia.dndacademy.config.FrontendOrigin;
import com.giulia.dndacademy.model.EmailOutbox;
import com.giulia.dndacademy.repository.*;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;
import java.util.*;
import static com.giulia.dndacademy.model.EmailOutbox.Status.*;

@Service @RequiredArgsConstructor
public class MailOutboxStore {
    private final EmailOutboxRepository outbox;
    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final FrontendOrigin origin;
    private final MailRenderer renderer;

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 5)
    public Claim claim(Instant now) {
        var rows = outbox.findReady(now, List.of(PENDING, PROCESSING), PageRequest.of(0, 1));
        if (rows.isEmpty()) return null;
        var task = rows.get(0);
        task.setStatus(PROCESSING);
        task.setLease(UUID.randomUUID().toString());
        task.setAttempts(task.getAttempts() + 1);
        task.setNextAttemptAt(now.plusSeconds(120));
        task.setUpdatedAt(now);
        return new Claim(task.getId(), task.getLease(), task.getUserId(), task.getRecipient(), task.getKind(),
                task.getResetTokenHash(), task.getExpiresAt(), task.getAttempts());
    }

    @Transactional(readOnly = true)
    public MimeMessage prepare(Claim task, Instant now) {
        if (!now.isBefore(task.expiresAt())) return null;
        var user = users.findById(task.userId()).orElse(null);
        if (user == null || !task.recipient().equalsIgnoreCase(user.getEmail())) return null;
        String link = null;
        if (task.kind() == EmailOutbox.Kind.PASSWORD_RESET) {
            var reset = tokens.findByUserId(task.userId()).orElse(null);
            if (reset == null || reset.isUsed() || !reset.getExpirationDate().isAfter(LocalDateTime.ofInstant(now, ZoneOffset.UTC))
                    || !Objects.equals(task.resetHash(), MailTokens.hash(reset.getToken()))) return null;
            link = origin.baseUrl() + "/reset-password?token=" + reset.getToken();
        }
        return renderer.render(task.id(), task.recipient(), user.getUsername(), link);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 5)
    public void finish(Claim claim, EmailOutbox.Status status, MailDeliveryException.Reason reason, Instant next, Instant now) {
        outbox.findLocked(claim.id()).ifPresent(task -> {
            if (task.getStatus() != PROCESSING || !Objects.equals(task.getLease(), claim.lease())) return;
            task.setStatus(status);
            task.setLastFailure(reason == null ? null : reason.name());
            task.setLease(null);
            task.setNextAttemptAt(next);
            task.setUpdatedAt(now);
        });
    }

    public record Claim(String id, String lease, Long userId, String recipient, EmailOutbox.Kind kind,
            String resetHash, Instant expiresAt, int attempts) {
        @Override public String toString() { return "RichiestaEmail[" + id + "]"; }
    }
}
