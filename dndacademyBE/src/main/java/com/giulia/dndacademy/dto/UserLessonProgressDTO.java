package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserLessonProgressDTO {

    private Long lessonId;
    private String title;
    private int orderIndex;

    private boolean unlocked;
    private boolean completed;
    private LocalDateTime completedAt;
}