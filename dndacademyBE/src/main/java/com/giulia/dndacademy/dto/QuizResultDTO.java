package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResultDTO {

    private Long quizId;
    private int totalQuestions;
    private int correctAnswers;
    private int score;
    private boolean passed;
}