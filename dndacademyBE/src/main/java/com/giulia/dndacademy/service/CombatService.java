package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.AttackResultDTO;
import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;

public interface CombatService {

    CombatDTO startChapterCombat(Long chapterId, String username);

    Long getCurrentTurn(Long combatId, String username);

    CombatStatusDTO getCombatStatus(Long combatId, String username);

    AttackResultDTO attack(AttackRequest request, String username);
}