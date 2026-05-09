package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuizRequest {

    @NotBlank
    private String title;

    private Long lessonId;

    private int passingScore;
}