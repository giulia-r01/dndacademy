package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatStatusDTO {

    private Long combatId;
    private Long campaignId;
    private Long currentTurnCharacterId;

    private boolean combatOver;
    private Long winnerCharacterId;

    private List<CombatFighterDTO> fighters;
}
