package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CharacterStatsDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.CharacterStats;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CharacterStatsRepository;
import com.giulia.dndacademy.service.CharacterService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import com.giulia.dndacademy.model.Character;

@Service
@RequiredArgsConstructor
public class CharacterServiceImpl implements CharacterService {

    private final CharacterRepository characterRepository;
    private final CharacterStatsRepository characterStatsRepository;
    private final CampaignRepository campaignRepository;
    private final UserService userService;

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
                .player(player)
                .campaign(campaign)
                .build();

        Character saved = characterRepository.save(character);

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
}
