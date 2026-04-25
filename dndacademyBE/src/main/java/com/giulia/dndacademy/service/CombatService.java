package com.giulia.dndacademy.service;

import com.giulia.dndacademy.model.Combat;

public interface CombatService {

    Combat startCombat(Long campaignId);

    Long getCurrentTurn(Long combatId);

    void nextTurn(Long combatId);
}
