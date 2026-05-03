package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;

public interface CombatService {

    CombatDTO startCombat(Long campaignId);

    Long getCurrentTurn(Long combatId);

    void nextTurn(Long combatId);

    CombatStatusDTO getCombatStatus(Long combatId);
}
