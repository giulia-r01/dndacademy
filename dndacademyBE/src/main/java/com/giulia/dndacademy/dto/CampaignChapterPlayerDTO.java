package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignChapterPlayerDTO {

    private Long chapterId;

    private Long campaignId;

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

    private boolean unlocked;

    private boolean completed;

    private LocalDateTime completedAt;
}