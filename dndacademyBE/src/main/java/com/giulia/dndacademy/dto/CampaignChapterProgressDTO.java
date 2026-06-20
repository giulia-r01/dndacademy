package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignChapterProgressDTO {

    private Long chapterId;

    private String chapterTitle;

    private int orderIndex;

    private boolean unlocked;

    private boolean completed;

    private LocalDateTime completedAt;
}