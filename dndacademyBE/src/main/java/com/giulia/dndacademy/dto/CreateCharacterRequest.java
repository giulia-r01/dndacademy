package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCharacterRequest {

    private String name;

    private String race;

    private String characterClass;

    private int level;

    private Long campaignId;

    private CharacterStatsDTO stats;

    private int maxHp;

    private int armorClass;
}
