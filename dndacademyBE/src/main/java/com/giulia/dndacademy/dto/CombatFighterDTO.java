package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatFighterDTO {

    private Long characterId;
    private String name;
    private String characterClass;

    private int currentHp;
    private int maxHp;
    private int armorClass;

    private boolean alive;
    private boolean currentTurn;
    private int initiative;
}
