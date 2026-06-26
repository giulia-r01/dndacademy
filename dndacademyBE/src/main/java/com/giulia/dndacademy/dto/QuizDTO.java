package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDTO {

    private Long id;
    private String title;

    private Long lessonId;
    private String lessonTitle;

    private int passingScore;

    private long questionCount;
    private boolean hasResults;
    private boolean usedInChapters;
}