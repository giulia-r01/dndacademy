package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NpcRequest {

    @NotBlank(message = "Il nome è obbligatorio")
    @Size(max = 255)
    private String name;

    @Size(max = 1000)
    private String description;

    @NotNull(message = "Gli HP sono obbligatori")
    @Min(value = 1, message = "Gli HP devono essere almeno 1")
    private Integer maxHp;

    @NotNull(message = "La classe armatura è obbligatoria")
    @Min(value = 1, message = "La classe armatura deve essere almeno 1")
    private Integer armorClass;

    @NotNull(message = "La destrezza è obbligatoria")
    @Min(value = 1, message = "La destrezza deve essere almeno 1")
    private Integer dexterity;

    @NotNull(message = "Il modificatore di attacco è obbligatorio")
    private Integer attackModifier;

    @NotNull(message = "Il dado danni è obbligatorio")
    @Min(value = 1, message = "Il dado danni deve essere positivo")
    private Integer damageDie;

    @NotNull(message = "Il modificatore dei danni è obbligatorio")
    private Integer damageModifier;

    @NotNull(message = "Specificare se l'NPC è nemico")
    private Boolean enemy;

    private boolean healer;
    private int healingDie;
    private int healingModifier;
    private int healingUses;
}
