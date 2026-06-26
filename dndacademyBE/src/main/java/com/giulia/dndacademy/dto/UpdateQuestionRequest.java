package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuestionRequest {

    @NotBlank(message = "Il testo della domanda è obbligatorio")
    private String text;
}