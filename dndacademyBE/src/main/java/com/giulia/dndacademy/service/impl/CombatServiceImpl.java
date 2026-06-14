package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatFighterDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.Combat;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CombatRepository;
import com.giulia.dndacademy.service.CombatService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CombatServiceImpl implements CombatService {

    private final CampaignRepository campaignRepository;
    private final CharacterRepository characterRepository;
    private final CombatRepository combatRepository;
    private final UserService userService;

    @Override
    public CombatDTO startCombat(Long campaignId, String username) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        List<Character> characters = characterRepository.findByCampaignIdAndPlayerIsNotNull(campaignId);

        if (characters.size() < 2) {
            throw new RuntimeException("Servono almeno 2 personaggi per iniziare un combattimento");
        }

        boolean hasCharacterWithoutStats = characters.stream()
                .anyMatch(character -> character.getStats() == null);

        if (hasCharacterWithoutStats) {
            throw new RuntimeException("Tutti i personaggi devono avere statistiche prima del combattimento");
        }

        List<CharacterInitiative> initiatives = characters.stream()
                .filter(Character::isAlive)
                .map(character -> new CharacterInitiative(
                        character,
                        rollD20() + getModifier(character.getStats().getDexterity())
                ))
                .sorted((a, b) -> Integer.compare(b.initiative(), a.initiative()))
                .toList();

        if (initiatives.size() < 2) {
            throw new RuntimeException("Servono almeno 2 personaggi vivi per iniziare un combattimento");
        }

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
    public Long getCurrentTurn(Long combatId, String username) {

        Combat combat = getCombatOrThrow(combatId);

        checkCampaignAccess(combat.getCampaign(), username);

        if (isCombatOver(combat)) {
            throw new RuntimeException("Il combattimento è finito");
        }

        Character currentCharacter = getCurrentTurnCharacter(combat);

        if (!currentCharacter.isAlive()) {
            moveToNextAliveTurn(combat);
            combatRepository.save(combat);
            currentCharacter = getCurrentTurnCharacter(combat);
        }

        return currentCharacter.getId();
    }

    @Override
    public void nextTurn(Long combatId, String username) {

        Combat combat = getCombatOrThrow(combatId);

        checkCampaignAccess(combat.getCampaign(), username);

        if (isCombatOver(combat)) {
            throw new RuntimeException("Il combattimento è finito");
        }

        moveToNextAliveTurn(combat);

        combatRepository.save(combat);
    }

    @Override
    public CombatStatusDTO getCombatStatus(Long combatId, String username) {

        Combat combat = getCombatOrThrow(combatId);

        checkCampaignAccess(combat.getCampaign(), username);

        boolean combatOver = isCombatOver(combat);

        if (!combatOver) {
            Character currentTurnCharacter = getCurrentTurnCharacter(combat);

            if (!currentTurnCharacter.isAlive()) {
                moveToNextAliveTurn(combat);
                combat = combatRepository.save(combat);
            }
        }

        final Combat finalCombat = combat;

        Long currentTurnCharacterId = combatOver
                ? null
                : finalCombat.getTurnOrder().get(finalCombat.getCurrentTurnIndex());

        List<CombatFighterDTO> fighters = java.util.stream.IntStream
                .range(0, finalCombat.getTurnOrder().size())
                .mapToObj(index -> {
                    Long characterId = finalCombat.getTurnOrder().get(index);

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
                            .currentTurn(currentTurnCharacterId != null && character.getId().equals(currentTurnCharacterId))
                            .initiative(finalCombat.getInitiativeRolls().get(index))
                            .spellcaster(character.isSpellcaster())
                            .weaponName(character.getWeaponName())
                            .damageDie(character.getDamageDie())
                            .spellName(character.getSpellName())
                            .spellDamageDie(character.getSpellDamageDie())
                            .build();
                })
                .toList();

        List<CombatFighterDTO> aliveFighters = fighters.stream()
                .filter(CombatFighterDTO::isAlive)
                .toList();

        Long winnerCharacterId = combatOver && aliveFighters.size() == 1
                ? aliveFighters.get(0).getCharacterId()
                : null;

        return CombatStatusDTO.builder()
                .combatId(finalCombat.getId())
                .campaignId(finalCombat.getCampaign().getId())
                .currentTurnCharacterId(currentTurnCharacterId)
                .combatOver(combatOver)
                .winnerCharacterId(winnerCharacterId)
                .fighters(fighters)
                .build();
    }

    private Combat getCombatOrThrow(Long combatId) {
        return combatRepository.findById(combatId)
                .orElseThrow(() -> new RuntimeException("Combattimento non trovato"));
    }

    private Character getCurrentTurnCharacter(Combat combat) {
        Long currentCharacterId = combat.getTurnOrder().get(combat.getCurrentTurnIndex());

        return characterRepository.findById(currentCharacterId)
                .orElseThrow(() -> new RuntimeException("Personaggio di turno non trovato"));
    }

    private boolean isCombatOver(Combat combat) {
        long aliveCount = combat.getTurnOrder()
                .stream()
                .map(id -> characterRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Personaggio nel turno non trovato")))
                .filter(Character::isAlive)
                .count();

        return aliveCount <= 1;
    }

    private void moveToNextAliveTurn(Combat combat) {
        List<Long> turnOrder = combat.getTurnOrder();

        int currentIndex = combat.getCurrentTurnIndex();

        for (int i = 1; i <= turnOrder.size(); i++) {
            int nextIndex = (currentIndex + i) % turnOrder.size();

            Character nextCharacter = characterRepository.findById(turnOrder.get(nextIndex))
                    .orElseThrow(() -> new RuntimeException("Personaggio nel turno non trovato"));

            if (nextCharacter.isAlive()) {
                combat.setCurrentTurnIndex(nextIndex);
                return;
            }
        }

        throw new RuntimeException("Nessun personaggio vivo trovato");
    }

    private int rollD20() {
        return (int) (Math.random() * 20) + 1;
    }

    private int getModifier(int stat) {
        return Math.floorDiv(stat - 10, 2);
    }

    private void checkCampaignAccess(Campaign campaign, String username) {
        User user = userService.getByUsername(username);

        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }
    }

    private record CharacterInitiative(Character character, int initiative) {
    }
}