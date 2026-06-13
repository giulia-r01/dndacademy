package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CombatActionType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttackRequest {

    @NotNull(message = "Attaccante obbligatorio")
    private Long attackerId;

    @NotNull(message = "Bersaglio obbligatorio")
    private Long targetId;

    @NotNull(message = "Combattimento obbligatorio")
    private Long combatId;

    @NotNull(message = "Tipo azione obbligatorio")
    private CombatActionType actionType;
}