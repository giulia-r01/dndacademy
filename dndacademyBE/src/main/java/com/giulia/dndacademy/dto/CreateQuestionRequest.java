package com.giulia.dndacademy.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {

    @NotNull(message = "QuizId obbligatorio")
    private Long quizId;

    @NotBlank(message = "Il testo della domanda è obbligatorio")
    private String text;

    @Valid
    @NotEmpty(message = "La domanda deve avere almeno una risposta")
    private List<CreateAnswerRequest> answers;
}