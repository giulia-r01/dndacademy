package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionRequest {

    private Long quizId;
    private String text;
    private List<CreateAnswerRequest> answers;
}