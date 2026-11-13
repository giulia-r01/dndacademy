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
    @Scheduled(initialDelay = 10000, fixedDelay = 15000)
    public void dispatch() {
        try {
            for (int count = 0; count < 20; count++) {
                if (!dispatcher.runOne()) break;
            }
        } catch (RuntimeException ex) { log.error("Elaborazione della coda email non disponibile ({})", ex.getClass().getSimpleName()); }
    }
    @Scheduled(initialDelay = 3600000, fixedDelay = 3600000)
    public void cleanup() { outbox.deleteExpired(Instant.now().minus(Duration.ofDays(7))); }
}
