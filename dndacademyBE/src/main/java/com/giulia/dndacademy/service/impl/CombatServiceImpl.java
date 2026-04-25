package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.Combat;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CombatRepository;
import com.giulia.dndacademy.service.CombatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CombatServiceImpl implements CombatService {

    private final CampaignRepository campaignRepository;
    private final CharacterRepository characterRepository;
    private final CombatRepository combatRepository;

    @Override
    public Combat startCombat(Long campaignId) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        List<Character> characters = characterRepository.findByCampaignId(campaignId);

        // 🎲 iniziativa random (semplificata)
        List<Long> turnOrder = characters.stream()
                .sorted((a, b) -> (int)(Math.random() * 20 - Math.random() * 20))
                .map(Character::getId)
                .toList();

        Combat combat = Combat.builder()
                .campaign(campaign)
                .turnOrder(turnOrder)
                .currentTurnIndex(0)
                .build();

        return combatRepository.save(combat);
    }

    @Override
    public Long getCurrentTurn(Long combatId) {

        Combat combat = combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combat not found"));

        return combat.getTurnOrder().get(combat.getCurrentTurnIndex());
    }

    @Override
    public void nextTurn(Long combatId) {

        Combat combat = combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combat not found"));

        int next = (combat.getCurrentTurnIndex() + 1) % combat.getTurnOrder().size();

        combat.setCurrentTurnIndex(next);

        combatRepository.save(combat);
    }
}
