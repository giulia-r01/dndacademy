package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignChapterDTO {

    private Long id;

    private Long campaignId;

    private String campaignName;

    private String title;

    private String description;

    private String storyText;

    private int orderIndex;

    private boolean hasCombat;

    private Long lessonId;

    private String lessonTitle;

    private Long quizId;

    private String quizTitle;

    private Long rewardBadgeId;

    private String rewardBadgeName;
}