package com.giulia.dndacademy.background;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import java.time.*;
import java.util.EnumMap;

@Component
public class QueueWakeups {
    public enum Kind { EMAIL, AVATAR }
    private static final class State {
        Instant next = Instant.MIN;
        long revision;
    }
    public record Scan(Kind kind, long revision) {}
    private final Duration recoveryInterval;
    private final EnumMap<Kind, State> states = new EnumMap<>(Kind.class);

    public QueueWakeups(@Value("${app.background.idle-rescan:PT15M}") Duration recoveryInterval) {
        if (recoveryInterval.isZero() || recoveryInterval.isNegative() || recoveryInterval.compareTo(Duration.ofHours(1)) > 0) {
            throw new IllegalArgumentException("app.background.idle-rescan deve essere maggiore di zero e non superare un ora");
        }
        this.recoveryInterval = recoveryInterval;
        for (Kind kind : Kind.values()) states.put(kind, new State());
    }

    @TransactionalEventListener
    public synchronized void afterCommit(QueueChanged event) {
        State state = states.get(event.kind());
        state.revision++;
        state.next = Instant.MIN;
    }

    public synchronized Scan begin(Kind kind, Instant now) {
        State state = states.get(kind);
        return now.isBefore(state.next) ? null : new Scan(kind, state.revision);
    }

    public synchronized void finish(Scan scan, Instant nextTask, Instant now) {
        State state = states.get(scan.kind());
        if (state.revision != scan.revision()) { state.next = Instant.MIN; return; }
        Instant recovery = now.plus(recoveryInterval);
        state.next = nextTask == null || nextTask.isAfter(recovery) ? recovery : nextTask;
    }

    public synchronized void failed(Scan scan, Instant now) {
        finish(scan, now.plusSeconds(30), now);
    }
}
