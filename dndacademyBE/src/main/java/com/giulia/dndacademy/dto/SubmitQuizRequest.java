package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitQuizRequest {

    private Long quizId;
    private List<SubmitAnswerRequest> answers;
}