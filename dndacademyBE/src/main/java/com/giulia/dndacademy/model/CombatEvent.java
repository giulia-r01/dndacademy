package com.giulia.dndacademy.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.Column;
import lombok.*;

@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CombatEvent {
    private Long attackerId;
    private String attackerName;
    private Long targetId;
    private String targetName;
    private boolean enemy;
    private boolean hit;
    private boolean critical;
    private int attackRoll;
    private int totalAttack;
    private int targetArmorClass;
    private int damage;
    private int targetHpBefore;
    private int targetRemainingHp;
    @Builder.Default
    @Column(nullable = false)
    private String actionType = "ATTACK";
    @Column(nullable = false)
    private int healing;
    @Column(nullable = false)
    private int healingRoll;
    @Column(nullable = false)
    private int healingDie;
}
