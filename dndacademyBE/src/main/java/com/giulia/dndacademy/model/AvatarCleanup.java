package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "avatar_cleanup")
@Getter @Setter @NoArgsConstructor
public class AvatarCleanup {
    @Id private String id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false) private Instant nextAttemptAt;
    @Column(nullable = false) private int attempts;
    private String lease;
}
