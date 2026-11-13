package com.giulia.dndacademy.security.ratelimit;

import com.giulia.dndacademy.model.AuthRateLimitBucket;
import com.giulia.dndacademy.repository.AuthRateLimitBucketRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.HexFormat;
import java.util.Locale;

@Service
public class AuthRateLimiter {
    private final AuthRateLimitBucketRepository buckets;
    private final TransactionTemplate transaction;
    private final byte[] secret;
    private final Clock clock;

    @Autowired
    public AuthRateLimiter(AuthRateLimitBucketRepository buckets, PlatformTransactionManager manager,
            @Value("${JWT_SECRET}") String secret) {
        this(buckets, manager, secret, Clock.systemUTC());
    }

    AuthRateLimiter(AuthRateLimitBucketRepository buckets, PlatformTransactionManager manager, String secret, Clock clock) {
        this.buckets = buckets;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.clock = clock;
        this.transaction = new TransactionTemplate(manager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transaction.setTimeout(5);
    }

    public void checkAddress(String action, String address) {
        switch (action) {
            case "login" -> consume("ip:login", address, 60, Duration.ofMinutes(15));
            case "register" -> consume("ip:register", address, 10, Duration.ofHours(1));
            case "forgot-password" -> consume("ip:forgot", address, 10, Duration.ofMinutes(15));
            case "reset-password" -> consume("ip:reset", address, 20, Duration.ofMinutes(15));
            default -> throw new IllegalArgumentException("Unsupported authentication action");
        }
    }

    public void checkIdentity(String action, String identity) {
        String normalized = identity.trim().toLowerCase(Locale.ROOT);
        switch (action) {
            case "login" -> consume("account:login", normalized, 20, Duration.ofMinutes(15));
            case "register" -> consume("account:register", normalized, 5, Duration.ofHours(1));
            case "forgot-password" -> consume("account:forgot", normalized, 3, Duration.ofMinutes(15));
            default -> throw new IllegalArgumentException("Unsupported authentication action");
        }
    }

    // A rejected request never extends the deadline. Successful requests count too.
    // Commit independently of authentication failure or the caller's transaction.
    void consume(String scope, String subject, int limit, Duration window) {
        String key = key(scope, subject);
        for (int retry = 0; retry < 3; retry++) {
            try {
                Long remaining = transaction.execute(status -> {
                    Instant now = clock.instant();
                    AuthRateLimitBucket bucket = buckets.findLocked(key).orElse(null);
                    if (bucket == null) {
                        buckets.saveAndFlush(new AuthRateLimitBucket(key, 1, now.plus(window)));
                        return 0L;
                    }
                    if (!now.isBefore(bucket.getExpiresAt())) {
                        bucket.setAttempts(1);
                        bucket.setExpiresAt(now.plus(window));
                    } else if (bucket.getAttempts() >= limit) {
                        return Math.max(1L, (Duration.between(now, bucket.getExpiresAt()).toMillis() + 999) / 1000);
                    } else {
                        bucket.setAttempts(bucket.getAttempts() + 1);
                    }
                    return 0L;
                });
                if (remaining != null && remaining > 0) {
                    throw new RateLimitExceeded(remaining);
                }
                return;
            } catch (DataIntegrityViolationException race) {
                // Two instances may insert the first bucket together. Retry in a new transaction.
                if (retry == 2) throw race;
            }
        }
    }

    private static class RateLimitExceeded extends ResponseStatusException {
        private final long seconds;
        RateLimitExceeded(long seconds) {
            super(HttpStatus.TOO_MANY_REQUESTS, "Troppi tentativi. Riprova tra " + seconds + " secondi.");
            this.seconds = seconds;
        }
        @Override public org.springframework.http.HttpHeaders getHeaders() {
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Retry-After", Long.toString(seconds));
            headers.setCacheControl("no-store");
            return headers;
        }
    }

    private String key(String scope, String subject) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal((scope + "\n" + subject).getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.GeneralSecurityException ex) {
            throw new IllegalStateException("Unable to initialize authentication limiter", ex);
        }
    }
}
