package com.giulia.dndacademy.background;

import org.junit.jupiter.api.Test;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;

class QueueWakeupsTest {
    private final Instant now=Instant.parse("2026-11-13T10:00:00Z");
    private final QueueWakeups wakeups=new QueueWakeups(Duration.ofMinutes(15));

    @Test void emptyQueueSleepsAndIsRecoveredPeriodically() {
        var scan=wakeups.begin(QueueWakeups.Kind.EMAIL,now); assertNotNull(scan);
        wakeups.finish(scan,null,now);
        assertNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(15)));
        assertNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(899)));
        assertNotNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(900)));
    }

    @Test void knownRetryKeepsItsOwnDeadline() {
        var scan=wakeups.begin(QueueWakeups.Kind.EMAIL,now);
        wakeups.finish(scan,now.plusSeconds(60),now);
        assertNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(59)));
        assertNotNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(60)));
    }

    @Test void aCommitWakesOnlyTheQueueThatChanged() {
        wakeups.finish(wakeups.begin(QueueWakeups.Kind.EMAIL,now),null,now);
        wakeups.finish(wakeups.begin(QueueWakeups.Kind.AVATAR,now),null,now);
        wakeups.afterCommit(new QueueChanged(QueueWakeups.Kind.EMAIL));
        assertNotNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(1)));
        assertNull(wakeups.begin(QueueWakeups.Kind.AVATAR,now.plusSeconds(1)));
    }

    @Test void aCommitDuringAScanCannotBeOverwrittenByItsEmptyResult() {
        var scan=wakeups.begin(QueueWakeups.Kind.EMAIL,now);
        wakeups.afterCommit(new QueueChanged(QueueWakeups.Kind.EMAIL));
        wakeups.finish(scan,null,now);
        assertNotNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(1)));
    }

    @Test void databaseFailureIsRetriedWithoutABusyLoop() {
        var scan=wakeups.begin(QueueWakeups.Kind.AVATAR,now);
        wakeups.failed(scan,now);
        assertNull(wakeups.begin(QueueWakeups.Kind.AVATAR,now.plusSeconds(29)));
        assertNotNull(wakeups.begin(QueueWakeups.Kind.AVATAR,now.plusSeconds(30)));
    }

    @Test void futureTasksDoNotPreventPeriodicRecoveryOfOtherInstances() {
        var scan=wakeups.begin(QueueWakeups.Kind.EMAIL,now);
        wakeups.finish(scan,now.plusSeconds(7200),now);
        assertNotNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now.plusSeconds(900)));
    }

    @Test void invalidRecoveryIntervalsAreRejected() {
        for(var interval: new Duration[]{Duration.ZERO,Duration.ofSeconds(-1),Duration.ofHours(2)})
            assertThrows(IllegalArgumentException.class,()->new QueueWakeups(interval));
    }
}
