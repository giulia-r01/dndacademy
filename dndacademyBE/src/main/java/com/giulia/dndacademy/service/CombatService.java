package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;

public interface CombatService {

    CombatDTO startCombat(Long campaignId, String username);

    Long getCurrentTurn(Long combatId, String username);

    void nextTurn(Long combatId, String username);

    CombatStatusDTO getCombatStatus(Long combatId, String username);
}