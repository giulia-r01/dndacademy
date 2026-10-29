package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpcDTO {

    private Long id;

    private String name;

    private String imageUrl;

    private String description;

    private int maxHp;

    private int armorClass;

    private int dexterity;

    private int attackModifier;

    private int damageDie;

    private int damageModifier;

    private boolean enemy;

    private boolean healer;
    private int healingDie;
    private int healingModifier;
    private int healingUses;
}
