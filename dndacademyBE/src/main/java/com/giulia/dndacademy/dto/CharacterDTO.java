package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterDTO {

    private Long id;

    private String name;

    private String race;

    private String characterClass;

    private int level;

    private String playerUsername;

    private Long campaignId;

    private int maxHp;

    private int currentHp;

    private int armorClass;
}
