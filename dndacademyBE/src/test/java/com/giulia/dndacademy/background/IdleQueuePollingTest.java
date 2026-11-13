package com.giulia.dndacademy.background;

import com.giulia.dndacademy.mail.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.Test;
import java.time.Duration;
import static org.mockito.Mockito.*;

class IdleQueuePollingTest {
    @Test void emptyMailQueueDoesNotReachDatabaseOnEverySchedulerTick() {
        var dispatcher=mock(MailOutboxDispatcher.class);
        var tasks=mock(EmailOutboxRepository.class);
        var wakeups=new QueueWakeups(Duration.ofMinutes(15));
        var scheduler=new MailOutboxScheduler(dispatcher,tasks,wakeups);
        scheduler.dispatch(); scheduler.dispatch();
        verify(dispatcher,times(1)).runOne(); verify(tasks,times(1)).nextAttempt(any());
        wakeups.afterCommit(new QueueChanged(QueueWakeups.Kind.EMAIL));
        scheduler.dispatch();
        verify(dispatcher,times(2)).runOne(); verify(tasks,times(2)).nextAttempt(any());
    }

    @Test void emptyAvatarQueueDoesNotReachDatabaseOnEverySchedulerTick() {
        var store=mock(AvatarCleanupStore.class);
        var images=mock(ImageUploadService.class);
        var tasks=mock(AvatarCleanupRepository.class);
        var wakeups=new QueueWakeups(Duration.ofMinutes(15));
        var worker=new AvatarCleanupWorker(store,images,tasks,wakeups);
        worker.drain(); worker.drain();
        verify(store,times(1)).claim(any()); verify(tasks,times(1)).nextAttempt();
        wakeups.afterCommit(new QueueChanged(QueueWakeups.Kind.AVATAR));
        worker.drain();
        verify(store,times(2)).claim(any()); verify(tasks,times(2)).nextAttempt();
        verifyNoInteractions(images);
    }
}
