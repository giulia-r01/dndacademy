package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CharacterDTO;
import com.giulia.dndacademy.dto.CreateCharacterRequest;
import com.giulia.dndacademy.service.CharacterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PostMapping
    public CharacterDTO createCharacter(
            @RequestBody CreateCharacterRequest request,
            Authentication authentication
    ) {

        String username = authentication.getName();

        return characterService.createCharacter(request, username);
    }

    @GetMapping("/campaign/{campaignId}")
    public List<CharacterDTO> getCharactersByCampaign(@PathVariable Long campaignId) {
        return characterService.getCharactersByCampaign(campaignId);
    }

    @GetMapping("/me")
    public List<CharacterDTO> getMyCharacters(Authentication authentication) {

        String username = authentication.getName();

        return characterService.getMyCharacters(username);
    }
}
