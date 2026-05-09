package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.AttackRequest;
import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;

import java.util.List;

public interface CharacterService {

    CharacterDTO createCharacter(CreateCharacterRequest request, String username);

    List<CharacterDTO> getCharactersByCampaign(Long campaignId, String username);

    List<CharacterDTO> getMyCharacters(String username);

    CharacterDTO damageCharacter(Long characterId, int damage);

    CharacterDTO healCharacter(Long characterId, int heal);

    String attack(AttackRequest request, String username);

}
