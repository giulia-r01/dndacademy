package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatFighterDTO {

    private Long participantId;
    private Long characterId;
    private Long npcId;

    private String name;
    private String imageUrl;
    private String characterClass;

    private int currentHp;
    private int maxHp;
    private int armorClass;

    private boolean alive;
    private boolean enemy;
    private boolean currentTurn;

    private int initiative;

    private boolean spellcaster;
    private String weaponName;
    private int damageDie;
    private String spellName;
    private int spellDamageDie;
    private boolean healer;
    private int healingUsesRemaining;
}
