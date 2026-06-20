package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignChapterRequest {

    @NotBlank(message = "Il titolo del capitolo è obbligatorio")
    private String title;

    private String description;

    @NotBlank(message = "Il testo narrativo è obbligatorio")
    private String storyText;

    @Min(value = 1, message = "L'ordine del capitolo deve essere almeno 1")
    private int orderIndex;

    private boolean hasCombat;

    private Long lessonId;

    private Long quizId;

    private Long rewardBadgeId;
}