package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.AttackResultDTO;
import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;

public interface CombatService {

    com.giulia.dndacademy.dto.CombatHistoryDTO getMyHistory(String username, int page, int size);

    com.giulia.dndacademy.dto.CombatPreviewDTO getChapterPreview(Long chapterId, String username);

    CombatDTO startChapterCombat(Long chapterId, String username);

    Long getCurrentTurn(Long combatId, String username);

    CombatStatusDTO getCombatStatus(Long combatId, String username);

    AttackResultDTO attack(AttackRequest request, String username);

    CombatStatusDTO advanceNpcTurn(Long combatId, int expectedEventCount, String username);
}
