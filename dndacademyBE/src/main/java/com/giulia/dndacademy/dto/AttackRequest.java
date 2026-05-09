package com.giulia.dndacademy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttackRequest {

    @NotNull(message = "AttackerId obbligatorio")
    private Long attackerId;

    @NotNull(message = "TargetId obbligatorio")
    private Long targetId;

    @Min(value = 1, message = "Il danno deve essere almeno 1")
    private int damage;

    @NotNull(message = "CombatId obbligatorio")
    private Long combatId;
}
