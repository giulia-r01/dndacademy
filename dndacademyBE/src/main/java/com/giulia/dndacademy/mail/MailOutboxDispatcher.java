package com.giulia.dndacademy.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.*;
import static com.giulia.dndacademy.model.EmailOutbox.Status.*;

@Service @Slf4j
public class MailOutboxDispatcher {
    private final MailOutboxStore store;
    private final MailTransport transport;
    private final Clock clock;
    @Autowired public MailOutboxDispatcher(MailOutboxStore store, MailTransport transport) {
        this(store, transport, Clock.systemUTC());
    }
    MailOutboxDispatcher(MailOutboxStore store, MailTransport transport, Clock clock) {
        this.store = store; this.transport = transport; this.clock = clock;
    }

    public boolean runOne() {
        var task = store.claim(clock.instant());
        if (task == null) return false;
        if (task.attempts() > 8 || !clock.instant().isBefore(task.expiresAt())) {
            store.finish(task, CANCELLED, null, clock.instant(), clock.instant());
            return true;
        }
        try {
            var message = store.prepare(task, clock.instant());
            if (message == null) store.finish(task, CANCELLED, null, clock.instant(), clock.instant());
            else {
                transport.send(message);
                store.finish(task, SENT, null, clock.instant(), clock.instant());
            }
        } catch (MailDeliveryException ex) {
            long baseDelay = ex.reason() == MailDeliveryException.Reason.QUOTA ? 300 : Math.min(900, 30L << Math.min(task.attempts() - 1, 6));
            Instant next = clock.instant().plusSeconds(Math.max(baseDelay, ex.retryAfterSeconds()));
            boolean retry = ex.retryable() && task.attempts() < 8 && next.isBefore(task.expiresAt());
            store.finish(task, retry ? PENDING : FAILED, ex.reason(), next, clock.instant());
            log.warn("Richiesta email {}: {} ({})", task.id(), retry ? "nuovo tentativo programmato" : "invio non riuscito", ex.reason());
        }
        return true;
    }
}
