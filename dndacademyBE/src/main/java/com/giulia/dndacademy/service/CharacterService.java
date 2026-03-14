package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;

import java.util.List;

public interface CharacterService {

    CharacterDTO createCharacter(CreateCharacterRequest request, String username);

    List<CharacterDTO> getCharactersByCampaign(Long campaignId);

    List<CharacterDTO> getMyCharacters(String username);
}
