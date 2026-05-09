package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateAnswerRequest {

    @NotBlank(message = "Il testo della risposta è obbligatorio")
    private String text;

    private boolean correct;
}