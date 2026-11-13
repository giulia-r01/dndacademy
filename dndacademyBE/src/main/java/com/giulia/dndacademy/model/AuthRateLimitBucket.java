package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "auth_rate_limit_buckets", indexes = @Index(name = "idx_auth_rate_limit_expiry", columnList = "expires_at"))
@Getter @Setter @NoArgsConstructor
public class AuthRateLimitBucket implements org.springframework.data.domain.Persistable<String> {
    @Id @Column(length = 64, nullable = false)
    private String id;
    @Column(nullable = false)
    private int attempts;
    @Column(nullable = false)
    private Instant expiresAt;

    @Transient
    private boolean newRecord = true;

    public AuthRateLimitBucket(String id, int attempts, Instant expiresAt) {
        this.id = id;
        this.attempts = attempts;
        this.expiresAt = expiresAt;
    }

    // Assigned IDs must use INSERT, never merge: a racing merge could overwrite a live quota.
    @Override public boolean isNew() { return newRecord; }
    @PostPersist @PostLoad void markPersisted() { newRecord = false; }
}
