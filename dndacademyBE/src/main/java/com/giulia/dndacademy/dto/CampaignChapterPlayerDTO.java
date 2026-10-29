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

    private String campaignName;

    private String title;

    private String description;

    private String storyText;

    private int orderIndex;

    private boolean hasCombat;

    private Long lessonId;

    private String lessonTitle;

    private boolean lessonCompleted;

    private Long quizId;

    private String quizTitle;

    private Long quizLessonId;

    private boolean quizPassed;

    private boolean combatWon;

    private Long rewardBadgeId;

    private String rewardBadgeName;

    private boolean unlocked;

    private boolean completed;

    private LocalDateTime completedAt;
}
