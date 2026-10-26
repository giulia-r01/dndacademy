package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterNpcRequest {

    @NotNull(message = "L'NPC è obbligatorio")
    private Long npcId;

    @NotNull(message = "La quantità è obbligatoria")
    @Min(value = 1, message = "La quantità deve essere almeno 1")
    @Max(value = 20, message = "Massimo 20 copie per NPC")
    private Integer quantity;
}