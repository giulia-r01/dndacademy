package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuizRequest {

    @NotBlank(message = "Il titolo è obbligatorio")
    private String title;

    @NotNull(message = "La lezione è obbligatoria")
    private Long lessonId;

    @Min(value = 1, message = "Il punteggio minimo deve essere almeno 1")
    @Max(value = 100, message = "Il punteggio massimo è 100")
    private int passingScore;
}