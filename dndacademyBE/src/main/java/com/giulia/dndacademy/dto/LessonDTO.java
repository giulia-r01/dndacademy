package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonDTO {

    private Long id;
    private String title;
    private String content;
    private int orderIndex;
    private boolean unlockedByDefault;
}