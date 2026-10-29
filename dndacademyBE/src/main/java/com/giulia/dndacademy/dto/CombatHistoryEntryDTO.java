package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CombatHistoryEntryDTO {
    private Long combatId;
    private Long campaignId;
    private String campaignName;
    private Long chapterId;
    private String chapterTitle;
    private String encounterTitle;
    private String characterName;
    private String characterImageUrl;
    private Integer characterCurrentHp;
    private Integer characterMaxHp;
    private boolean completed;
    private CombatOutcome outcome;
    private LocalDateTime completedAt;
}
