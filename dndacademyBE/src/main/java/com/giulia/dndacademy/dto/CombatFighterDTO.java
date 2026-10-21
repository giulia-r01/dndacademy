package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatFighterDTO {

    // Identificativi
    private Long participantId;
    private Long characterId;
    private Long npcId;

    // Informazioni del combattente
    private String name;
    private String characterClass;

    // Stato durante il combattimento
    private int currentHp;
    private int maxHp;
    private int armorClass;

    private boolean alive;
    private boolean enemy;
    private boolean currentTurn;

    private int initiative;

    // Armi e incantesimi
    private boolean spellcaster;
    private String weaponName;
    private int damageDie;
    private String spellName;
    private int spellDamageDie;
}