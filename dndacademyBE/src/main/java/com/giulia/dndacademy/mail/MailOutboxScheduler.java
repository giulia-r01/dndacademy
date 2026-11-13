package com.giulia.dndacademy.mail;

import com.giulia.dndacademy.repository.EmailOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.*;

@Component @RequiredArgsConstructor @Slf4j
@ConditionalOnProperty(name = "app.mail.worker-enabled", havingValue = "true", matchIfMissing = true)
public class MailOutboxScheduler {
    private final MailOutboxDispatcher dispatcher;
    private final EmailOutboxRepository outbox;
    private final com.giulia.dndacademy.background.QueueWakeups wakeups;
    @Scheduled(initialDelay = 10000, fixedDelay = 15000)
    public void dispatch() {
        var scan = wakeups.begin(com.giulia.dndacademy.background.QueueWakeups.Kind.EMAIL, Instant.now());
        if (scan == null) return;
        try {
            for (int count = 0; count < 20; count++) {
                if (!dispatcher.runOne()) break;
            }
            wakeups.finish(scan, outbox.nextAttempt(java.util.List.of(com.giulia.dndacademy.model.EmailOutbox.Status.PENDING,
                    com.giulia.dndacademy.model.EmailOutbox.Status.PROCESSING)), Instant.now());
        } catch (RuntimeException ex) {
            wakeups.failed(scan, Instant.now());
            log.error("Elaborazione della coda email non disponibile ({})", ex.getClass().getSimpleName());
        }
    }
    @Scheduled(initialDelay = 3600000, fixedDelay = 3600000)
    public void cleanup() { outbox.deleteExpired(Instant.now().minus(Duration.ofDays(7))); }
}
