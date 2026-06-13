package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.AttackAbility;
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

    private String weaponName;
    private int damageDie;
    private AttackAbility attackAbility;

    private boolean spellcaster;
    private String spellName;
    private int spellDamageDie;
    private AttackAbility spellAbility;
}