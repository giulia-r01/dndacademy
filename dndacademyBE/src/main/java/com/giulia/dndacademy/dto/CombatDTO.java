package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatDTO {

    private Long id;
    private Long campaignId;
    private Long chapterId;

    private List<Long> turnOrder;
    private int currentTurnIndex;
    private List<Integer> initiativeRolls;

    private boolean completed;
    private Long winnerCharacterId;
    private LocalDateTime completedAt;
}