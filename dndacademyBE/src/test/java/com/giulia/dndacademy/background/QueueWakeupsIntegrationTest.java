package com.giulia.dndacademy.background;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class QueueWakeupsIntegrationTest {
    @Autowired QueueWakeups wakeups;
    @Autowired ApplicationEventPublisher events;
    @Autowired PlatformTransactionManager transactions;

    @Test void queueNotificationTakesEffectOnlyAfterCommit() {
        Instant now=Instant.now();
        wakeups.finish(wakeups.begin(QueueWakeups.Kind.EMAIL,now),null,now);
        new TransactionTemplate(transactions).executeWithoutResult(status->{
            events.publishEvent(new QueueChanged(QueueWakeups.Kind.EMAIL));
            assertNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now));
        });
        var scan=wakeups.begin(QueueWakeups.Kind.EMAIL,now); assertNotNull(scan);
        wakeups.finish(scan,null,now);
        new TransactionTemplate(transactions).executeWithoutResult(status->{
            events.publishEvent(new QueueChanged(QueueWakeups.Kind.EMAIL)); status.setRollbackOnly();
        });
        assertNull(wakeups.begin(QueueWakeups.Kind.EMAIL,now));
    }
}
