package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CharacterStatsDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CharacterStatsRepository;
import com.giulia.dndacademy.repository.CombatRepository;
import com.giulia.dndacademy.service.CharacterService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final CampaignRepository campaignRepository;
    private final UserService userService;
    private final CombatRepository combatRepository;

    @Override
    public CharacterDTO createCharacter(CreateCharacterRequest request, String username) {

        User player = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new RuntimeException("Nessuna campagna trovata"));

        boolean isPlayer = campaign.getPlayers().contains(player);
        boolean isMaster = campaign.getMaster().equals(player);

        if (!isPlayer && !isMaster) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }

        Character character = Character.builder()
                .name(request.getName())
                .race(request.getRace())
                .characterClass(request.getCharacterClass())
                .level(request.getLevel())
                .maxHp(request.getMaxHp())
                .currentHp(request.getMaxHp())
                .armorClass(request.getArmorClass())
                .player(player)
                .campaign(campaign)
                .build();

        Character saved = characterRepository.save(character);

        if (request.getStats() == null) {
            throw new RuntimeException("Stats obbligatorie");
        }

        CharacterStatsDTO statsDTO = request.getStats();

        CharacterStats stats = CharacterStats.builder()
                .strength(statsDTO.getStrength())
                .dexterity(statsDTO.getDexterity())
                .constitution(statsDTO.getConstitution())
                .intelligence(statsDTO.getIntelligence())
                .wisdom(statsDTO.getWisdom())
                .charisma(statsDTO.getCharisma())
                .character(saved)
                .build();

        characterStatsRepository.save(stats);

        return CharacterDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .race(saved.getRace())
                .characterClass(saved.getCharacterClass())
                .level(saved.getLevel())
                .maxHp(saved.getMaxHp())
                .currentHp(saved.getCurrentHp())
                .armorClass(saved.getArmorClass())
                .playerUsername(player.getUsername())
                .campaignId(campaign.getId())
                .build();
    }

    @Override
    public List<CharacterDTO> getCharactersByCampaign(Long campaignId) {

        return characterRepository.findByCampaignId(campaignId)
                .stream()
                .map(c -> CharacterDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .race(c.getRace())
                        .characterClass(c.getCharacterClass())
                        .level(c.getLevel())
                        .playerUsername(c.getPlayer().getUsername())
                        .campaignId(c.getCampaign().getId())
                        .build())
                .toList();
    }

    @Override
    public List<CharacterDTO> getMyCharacters(String username) {

        return characterRepository.findByPlayerUsername(username)
                .stream()
                .map(c -> CharacterDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .race(c.getRace())
                        .characterClass(c.getCharacterClass())
                        .level(c.getLevel())
                        .playerUsername(c.getPlayer().getUsername())
                        .campaignId(c.getCampaign().getId())
                        .build())
                .toList();
    }

    @Override
    public CharacterDTO damageCharacter(Long characterId, int damage) {

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Character not found"));

        int newHp = character.getCurrentHp() - damage;

        if (newHp < 0) newHp = 0;

        character.setCurrentHp(newHp);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    @Override
    public CharacterDTO healCharacter(Long characterId, int heal) {

        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Character not found"));

        int newHp = character.getCurrentHp() + heal;

        if (newHp > character.getMaxHp()) {
            newHp = character.getMaxHp();
        }

        character.setCurrentHp(newHp);

        Character saved = characterRepository.save(character);

        return mapToDTO(saved);
    }

    private CharacterDTO mapToDTO(Character c) {
        return CharacterDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .race(c.getRace())
                .characterClass(c.getCharacterClass())
                .level(c.getLevel())
                .maxHp(c.getMaxHp())
                .currentHp(c.getCurrentHp())
                .armorClass(c.getArmorClass())
                .playerUsername(c.getPlayer().getUsername())
                .campaignId(c.getCampaign().getId())
                .build();
    }

    @Override
    public String attack(AttackRequest request) {

        Character attacker = characterRepository.findById(request.getAttackerId())
                .orElseThrow(() -> new RuntimeException("Attacker not found"));

        Character target = characterRepository.findById(request.getTargetId())
                .orElseThrow(() -> new RuntimeException("Target not found"));

        Combat combat = combatRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active combat"));

        Long currentTurn = combat.getTurnOrder().get(combat.getCurrentTurnIndex());

        if (!attacker.getId().equals(currentTurn)) {
            throw new RuntimeException("Not your turn");
        }

        CharacterStats stats = attacker.getStats();

        int strengthMod = getModifier(stats.getStrength());

        // 🎲 tiro d20
        int roll = (int) (Math.random() * 20) + 1;

        int totalAttack = roll + strengthMod;

        // 💥 critico
        boolean isCritical = roll == 20;

        if (isCritical || totalAttack >= target.getArmorClass()) {

            int damage = request.getDamage() + strengthMod;

            if (isCritical) {
                damage *= 2;
            }

            int newHp = target.getCurrentHp() - damage;
            if (newHp < 0) newHp = 0;

            target.setCurrentHp(newHp);
            characterRepository.save(target);

            return "Colpito! 🎯 " +
                    (isCritical ? "CRITICO 💀 " : "") +
                    "| Tiro: " + roll +
                    " + mod(" + strengthMod + ")" +
                    " = " + totalAttack +
                    " vs AC " + target.getArmorClass() +
                    " | Danno: " + damage +
                    " | HP rimasti: " + newHp;
        }

        return "Mancato ❌ | Tiro: " + roll +
                " + mod(" + strengthMod + ")" +
                " = " + totalAttack +
                " vs AC " + target.getArmorClass();

    }

    private int getModifier(int stat) {
        return (stat - 10) / 2;
    }
}
