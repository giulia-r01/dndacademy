package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "email_outbox", indexes = @Index(name = "idx_email_outbox_dispatch", columnList = "status,next_attempt_at,created_at"))
@Getter @Setter @NoArgsConstructor
public class EmailOutbox {
    public enum Kind { WELCOME, PASSWORD_RESET }
    public enum Status { PENDING, PROCESSING, SENT, CANCELLED, FAILED }
    @Id @GeneratedValue(strategy = GenerationType.UUID) @Column(length = 36)
    private String id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 254) private String recipient;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Kind kind;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private Status status;
    @Column(length = 64) private String resetTokenHash;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant expiresAt;
    @Column(nullable = false) private Instant nextAttemptAt;
    @Column(nullable = false) private Instant updatedAt;
    @Column(nullable = false) private int attempts;
    @Column(length = 36) private String lease;
    @Column(length = 32) private String lastFailure;
}
