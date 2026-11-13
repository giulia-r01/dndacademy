package com.giulia.dndacademy.service;

import com.giulia.dndacademy.repository.AvatarCleanupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class AvatarCleanupStore {
    private final AvatarCleanupRepository tasks;

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 5)
    public Claim claim(Instant now) {
        var ready = tasks.findReady(now, PageRequest.of(0, 1));
        if (ready.isEmpty()) return null;
        var task = ready.get(0);
        task.setLease(UUID.randomUUID().toString());
        task.setAttempts(Math.min(task.getAttempts(), 30) + 1);
        task.setNextAttemptAt(now.plusSeconds(120));
        return new Claim(task.getId(), task.getUserId(), task.getLease(), task.getAttempts());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, timeout = 5)
    public void finish(Claim claim, boolean success, Instant now) {
        tasks.findLocked(claim.id()).ifPresent(task -> {
            if (!Objects.equals(task.getLease(), claim.lease())) return;
            if (success) tasks.delete(task);
            else {
                task.setLease(null);
                task.setNextAttemptAt(now.plusSeconds(Math.min(3600, 30L << Math.min(claim.attempts() - 1, 7))));
            }
        });
    }

    public record Claim(String id, Long userId, String lease, int attempts) {}
}
