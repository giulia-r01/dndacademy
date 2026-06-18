package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CharacterService {

    CharacterDTO createCharacter(CreateCharacterRequest request, String username);

    CharacterDTO claimCharacter(Long characterId, String username);

    List<CharacterDTO> getAvailableCharactersByCampaign(Long campaignId, String username);

    List<CharacterDTO> getCharactersByCampaign(Long campaignId, String username);

    List<CharacterDTO> getMyCharacters(String username);

    CharacterDTO damageCharacter(Long characterId, int damage);

    CharacterDTO healCharacter(Long characterId, int heal);

    AttackResultDTO attack(AttackRequest request, String username);

    CharacterDTO uploadCharacterImage(Long characterId, MultipartFile file, String username);

    CharacterDTO updateCharacter(Long characterId, UpdateCharacterRequest request, String username);

    void deleteCharacter(Long characterId, String username);
}