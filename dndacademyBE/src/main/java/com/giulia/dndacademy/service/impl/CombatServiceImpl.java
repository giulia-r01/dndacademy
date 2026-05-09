package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatFighterDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;
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
    private int rollD20() {
        return (int) (Math.random() * 20) + 1;
    }

    private int getModifier(int stat) {
        return (stat - 10) / 2;
    }

    @Override
    public CombatDTO startCombat(Long campaignId) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        List<Character> characters = characterRepository.findByCampaignId(campaignId);

        List<CharacterInitiative> initiatives = characters.stream()
                .map(character -> new CharacterInitiative(
                        character,
                        rollD20() + getModifier(character.getStats().getDexterity())
                ))
                .sorted((a, b) -> Integer.compare(b.initiative(), a.initiative()))
                .toList();

        List<Long> turnOrder = initiatives.stream()
                .map(item -> item.character().getId())
                .toList();

        List<Integer> initiativeRolls = initiatives.stream()
                .map(CharacterInitiative::initiative)
                .toList();

        Combat combat = Combat.builder()
                .campaign(campaign)
                .turnOrder(turnOrder)
                .initiativeRolls(initiativeRolls)
                .currentTurnIndex(0)
                .build();

        Combat saved = combatRepository.save(combat);

        return CombatDTO.builder()
                .id(saved.getId())
                .campaignId(campaign.getId())
                .turnOrder(saved.getTurnOrder())
                .initiativeRolls(saved.getInitiativeRolls())
                .currentTurnIndex(saved.getCurrentTurnIndex())
                .build();
    }

    @Override
    public Long getCurrentTurn(Long combatId) {

        Combat combat = combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combattimento non trovato"));

        return combat.getTurnOrder().get(combat.getCurrentTurnIndex());
    }

    @Override
    public void nextTurn(Long combatId) {

        Combat combat = combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combattimento non trovato"));

        List<Long> turnOrder = combat.getTurnOrder();

        long aliveCount = turnOrder.stream()
                .map(id -> characterRepository.findById(id).orElseThrow())
                .filter(Character::isAlive)
                .count();

        if (aliveCount <= 1) {
            throw new RuntimeException("Il combattimento è finito");
        }

        int nextIndex = combat.getCurrentTurnIndex();

        do {
            nextIndex = (nextIndex + 1) % turnOrder.size();

            Long characterId = turnOrder.get(nextIndex);

            Character character = characterRepository.findById(characterId)
                    .orElseThrow();

            if (character.isAlive()) {
                break;
            }

        } while (true);

        combat.setCurrentTurnIndex(nextIndex);

        combatRepository.save(combat);
    }

    @Override
    public CombatStatusDTO getCombatStatus(Long combatId) {

        Combat combat = combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combattimento non trovato"));

        Long currentTurnCharacterId = combat.getTurnOrder()
                .get(combat.getCurrentTurnIndex());

        List<CombatFighterDTO> fighters = java.util.stream.IntStream
                .range(0, combat.getTurnOrder().size())
                .mapToObj(index -> {
                    Long characterId = combat.getTurnOrder().get(index);

                    Character character = characterRepository.findById(characterId)
                            .orElseThrow(() -> new RuntimeException("Personaggio non trovato"));

                    return CombatFighterDTO.builder()
                            .characterId(character.getId())
                            .name(character.getName())
                            .characterClass(character.getCharacterClass())
                            .currentHp(character.getCurrentHp())
                            .maxHp(character.getMaxHp())
                            .armorClass(character.getArmorClass())
                            .alive(character.isAlive())
                            .currentTurn(character.getId().equals(currentTurnCharacterId))
                            .initiative(combat.getInitiativeRolls().get(index))
                            .build();
                })
                .toList();

        List<CombatFighterDTO> aliveFighters = fighters.stream()
                .filter(CombatFighterDTO::isAlive)
                .toList();

        boolean combatOver = aliveFighters.size() <= 1;

        Long winnerCharacterId = combatOver && aliveFighters.size() == 1
                ? aliveFighters.get(0).getCharacterId()
                : null;

        return CombatStatusDTO.builder()
                .combatId(combat.getId())
                .campaignId(combat.getCampaign().getId())
                .currentTurnCharacterId(currentTurnCharacterId)
                .combatOver(combatOver)
                .winnerCharacterId(winnerCharacterId)
                .fighters(fighters)
                .build();
    }

    private record CharacterInitiative(Character character, int initiative) {}
}
