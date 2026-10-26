package com.giulia.dndacademy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterRequest {

    @NotBlank(message = "Il titolo è obbligatorio")
    @Size(max = 255)
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Il capitolo è obbligatorio")
    private Long chapterId;

    @NotEmpty(message = "Aggiungi almeno un NPC")
    private List<@Valid EncounterNpcRequest> npcs;
}