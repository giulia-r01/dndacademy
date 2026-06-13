package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.AttackAbility;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCharacterRequest {

    @NotBlank(message = "Il nome è obbligatorio")
    private String name;

    @NotBlank(message = "La razza è obbligatoria")
    private String race;

    @NotBlank(message = "La classe è obbligatoria")
    private String characterClass;

    @Min(value = 1, message = "Il livello deve essere almeno 1")
    private int level;

    @NotNull(message = "La campagna è obbligatoria")
    private Long campaignId;

    @Min(value = 1, message = "Gli HP massimi devono essere almeno 1")
    private int maxHp;

    @Min(value = 1, message = "L'Armor Class deve essere almeno 1")
    private int armorClass;

    @Valid
    @NotNull(message = "Le statistiche sono obbligatorie")
    private CharacterStatsDTO stats;

    @NotBlank(message = "Il nome dell'arma è obbligatorio")
    private String weaponName;

    @Min(value = 4, message = "Il dado danno minimo è d4")
    @Max(value = 12, message = "Il dado danno massimo è d12")
    private int damageDie;

    @NotNull(message = "La caratteristica di attacco è obbligatoria")
    private AttackAbility attackAbility;

    private boolean spellcaster;

    private String spellName;

    private int spellDamageDie;

    private AttackAbility spellAbility;
}