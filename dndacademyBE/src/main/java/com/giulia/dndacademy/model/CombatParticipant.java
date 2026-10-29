package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "combat_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combat_id", nullable = false)
    private Combat combat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "character_id")
    private Character character;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "npc_id")
    private Npc npc;

    @Column(nullable = false)
    private int currentHp;

    @Column(nullable = false)
    private int maxHp;

    @Column(nullable = false)
    private int initiative;

    @Column(nullable = false)
    private boolean alive;

    @Column(nullable = false)
    private boolean enemy;
    @Column(nullable = false)
    private int healingUsed;
}
