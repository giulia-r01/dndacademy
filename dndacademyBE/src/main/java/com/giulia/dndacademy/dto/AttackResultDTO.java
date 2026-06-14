package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CombatActionType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttackResultDTO {

    private boolean hit;
    private boolean critical;

    private String actionName;

    private int attackRoll;
    private int abilityModifier;
    private int totalAttack;
    private int targetArmorClass;

    private int damage;
    private int targetRemainingHp;

    private boolean targetDefeated;
    private boolean combatOver;

    private Long winnerCharacterId;
    private Long nextTurnCharacterId;

    private String message;

    private CombatActionType actionType;
    private int damageDie;
    private int damageRoll;

    private Long attackerId;
    private String attackerName;

    private Long targetId;
    private String targetName;
}