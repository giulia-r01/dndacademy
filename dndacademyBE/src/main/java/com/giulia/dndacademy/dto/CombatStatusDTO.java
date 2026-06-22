package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatStatusDTO {

    private Long combatId;
    private Long campaignId;
    private Long chapterId;

    private Long currentTurnCharacterId;

    private boolean combatOver;
    private boolean completed;
    private Long winnerCharacterId;
    private LocalDateTime completedAt;

    private List<CombatFighterDTO> fighters;
}