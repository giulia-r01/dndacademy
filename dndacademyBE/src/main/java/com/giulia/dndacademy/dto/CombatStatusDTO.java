package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CombatOutcome;
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

    // Nuovo sistema narrativo
    private Long encounterId;
    private Long currentTurnParticipantId;
    private boolean combatOver;
    private boolean completed;

    private CombatOutcome outcome;
    private LocalDateTime completedAt;
    private List<CombatFighterDTO> fighters;
}