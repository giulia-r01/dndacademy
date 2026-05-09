package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserQuizResultDTO {

    private Long id;
    private Long quizId;
    private String quizTitle;
    private int score;
    private boolean passed;
    private LocalDateTime completedAt;
}