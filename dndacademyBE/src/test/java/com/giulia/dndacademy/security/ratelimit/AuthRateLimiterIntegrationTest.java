package com.giulia.dndacademy.security.ratelimit;

import com.giulia.dndacademy.repository.AuthRateLimitBucketRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:limiter_review;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000",
        "spring.datasource.username=sa", "spring.datasource.password="})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthRateLimiterIntegrationTest {
    @Autowired AuthRateLimitBucketRepository buckets;
    @Autowired PlatformTransactionManager manager;
    MutableClock clock;
    AuthRateLimiter limiter;
    @BeforeEach void prepare() {
        buckets.deleteAll();
        clock = new MutableClock();
        limiter = new AuthRateLimiter(buckets, manager, "isolated-limiter-test-key", clock);
    }
    @Test void blockPersistsAcrossInstancesAndExpiresWithoutExtendingOnRejection() {
        limiter.consume("test", "address", 2, Duration.ofMinutes(1));
        var second = new AuthRateLimiter(buckets, manager, "isolated-limiter-test-key", clock);
        second.consume("test", "address", 2, Duration.ofMinutes(1));
        var rejected = assertThrows(ResponseStatusException.class, () -> second.consume("test", "address", 2, Duration.ofMinutes(1)));
        assertEquals(429, rejected.getStatusCode().value());
        assertEquals("60", rejected.getHeaders().getFirst("Retry-After"));
        clock.now = clock.now.plusSeconds(59);
        assertEquals("1", assertThrows(ResponseStatusException.class, () -> limiter.consume("test", "address", 2, Duration.ofMinutes(1))).getHeaders().getFirst("Retry-After"));
        clock.now = clock.now.plusSeconds(1);
        limiter.consume("test", "address", 2, Duration.ofMinutes(1));
        assertEquals(1, buckets.findAll().get(0).getAttempts());
    }
    @Test void callerRollbackCannotUndoAttemptAndStoredKeysContainNoIdentity() {
        var outer = new TransactionTemplate(manager);
        outer.executeWithoutResult(status -> {
            limiter.checkIdentity("forgot-password", "Private@Example.test");
            status.setRollbackOnly();
        });
        assertEquals(1, buckets.count());
        assertTrue(buckets.findAll().get(0).getId().matches("[0-9a-f]{64}"));
        limiter.checkIdentity("forgot-password", " private@example.test ");
        limiter.checkIdentity("forgot-password", "PRIVATE@example.test");
        assertThrows(ResponseStatusException.class, () -> limiter.checkIdentity("forgot-password", "private@example.test"));
        limiter.checkIdentity("login", "private@example.test");
        limiter.checkIdentity("forgot-password", "other@example.test");
    }
    @Test void parallelFirstInsertsAndIncrementsCannotExceedQuota() throws Exception {
        var pool = Executors.newFixedThreadPool(8);
        var start = new CountDownLatch(1);
        AtomicInteger accepted = new AtomicInteger();
        List<Future<?>> tasks = new ArrayList<>();
        try {
            for (int i = 0; i < 24; i++) tasks.add(pool.submit(() -> {
                try {
                    start.await();
                    limiter.consume("parallel", "same", 5, Duration.ofMinutes(1));
                    accepted.incrementAndGet();
                } catch (ResponseStatusException ex) { assertEquals(429, ex.getStatusCode().value()); }
                catch (InterruptedException ex) { throw new RuntimeException(ex); }
            }));
            start.countDown();
            for (Future<?> task : tasks) task.get(30, TimeUnit.SECONDS);
            assertEquals(5, accepted.get());
            assertEquals(5, buckets.findAll().get(0).getAttempts());
        } finally { pool.shutdownNow(); }
    }
    @Test void cleanupDeletesOnlyOldExpiredCounters() {
        limiter.consume("old", "one", 1, Duration.ofMinutes(1));
        clock.now = clock.now.plus(Duration.ofDays(2));
        limiter.consume("new", "two", 1, Duration.ofMinutes(1));
        assertEquals(1, buckets.deleteExpired(clock.instant().minus(Duration.ofDays(1))));
        assertEquals(1, buckets.count());
    }
    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-11-13T10:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
    }
}
