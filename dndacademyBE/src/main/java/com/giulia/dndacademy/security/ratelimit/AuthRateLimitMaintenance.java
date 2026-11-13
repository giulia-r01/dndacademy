package com.giulia.dndacademy.security.ratelimit;

import com.giulia.dndacademy.repository.AuthRateLimitBucketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Configuration @EnableScheduling @RequiredArgsConstructor
public class AuthRateLimitMaintenance {
    private final AuthRateLimitBucketRepository buckets;

    @Scheduled(initialDelay = 3600000, fixedDelay = 3600000)
    public void removeExpiredCounters() {
        buckets.deleteExpired(Instant.now().minus(24, ChronoUnit.HOURS));
    }
}
