package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {

    @NotNull(message = "QuestionId obbligatorio")
    private Long questionId;

    @NotNull(message = "AnswerId obbligatorio")
    private Long answerId;
}