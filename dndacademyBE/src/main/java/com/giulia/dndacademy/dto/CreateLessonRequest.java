package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateLessonRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    private int orderIndex;

    private boolean unlockedByDefault;
}