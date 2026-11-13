package com.giulia.dndacademy.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.Instant;

@Component @RequiredArgsConstructor
@ConditionalOnProperty(name = "app.avatar-cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class AvatarCleanupWorker {
    private static final Logger log = LoggerFactory.getLogger(AvatarCleanupWorker.class);
    private final AvatarCleanupStore store;
    private final ImageUploadService images;

    @Scheduled(fixedDelay = 15000, initialDelay = 15000)
    public void drain() {
        try {
            for (int i = 0; i < 5; i++) if (!runOne(Instant.now())) break;
        } catch (RuntimeException ex) {
            log.warn("Pulizia avatar temporaneamente non disponibile; il lavoro resta persistito.");
        }
    }

    public boolean runOne(Instant now) {
        var task = store.claim(now);
        if (task == null) return false;
        boolean success = false;
        try {
            images.deleteUserImage(task.userId());
            success = true;
        } catch (RuntimeException ex) {
            log.warn("Pulizia avatar {} rinviata; nuovo tentativo automatico.", task.id());
        }
        store.finish(task, success, Instant.now());
        return true;
    }
}
