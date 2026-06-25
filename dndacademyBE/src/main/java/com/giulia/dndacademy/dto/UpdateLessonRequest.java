package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateLessonRequest {

    @NotBlank(message = "Il titolo è obbligatorio.")
    private String title;

    @NotBlank(message = "Il contenuto è obbligatorio.")
    private String content;

    @NotNull(message = "L'ordine della lezione è obbligatorio.")
    private Integer orderIndex;

    @NotNull(message = "Lo stato di sblocco iniziale è obbligatorio.")
    private Boolean unlockedByDefault;
}
