package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitQuizRequest {

    @NotNull(message = "QuizId obbligatorio")
    private Long quizId;

    @Valid
    @NotEmpty(message = "Devi inviare almeno una risposta")
    private List<SubmitAnswerRequest> answers;
}