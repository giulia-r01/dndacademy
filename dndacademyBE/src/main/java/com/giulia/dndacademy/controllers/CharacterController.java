package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.service.CharacterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/characters")
@RequiredArgsConstructor
public class CharacterController {

    private final CharacterService characterService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping
    public CharacterDTO createCharacter(
            @RequestBody @Valid CreateCharacterRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.createCharacter(request, username);
    }

    @PatchMapping("/{id}/claim")
    public CharacterDTO claimCharacter(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.claimCharacter(id, username);
    }

    @GetMapping("/campaign/{campaignId}/available")
    public List<CharacterDTO> getAvailableCharactersByCampaign(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.getAvailableCharactersByCampaign(campaignId, username);
    }

    @GetMapping("/campaign/{campaignId}")
    public List<CharacterDTO> getCharactersByCampaign(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.getCharactersByCampaign(campaignId, username);
    }

    @GetMapping("/me")
    public List<CharacterDTO> getMyCharacters(Authentication authentication) {
        String username = authentication.getName();
        return characterService.getMyCharacters(username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PatchMapping("/{id}/damage")
    public CharacterDTO damage(
            @PathVariable Long id,
            @RequestParam int amount
    ) {
        return characterService.damageCharacter(id, amount);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PatchMapping("/{id}/heal")
    public CharacterDTO heal(
            @PathVariable Long id,
            @RequestParam int amount
    ) {
        return characterService.healCharacter(id, amount);
    }

    @PostMapping("/attack")
    public AttackResultDTO attack(
            @RequestBody @Valid AttackRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.attack(request, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PatchMapping("/{id}/image")
    public CharacterDTO uploadCharacterImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.uploadCharacterImage(id, file, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PutMapping("/{id}")
    public CharacterDTO updateCharacter(
            @PathVariable Long id,
            @RequestBody @Valid UpdateCharacterRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.updateCharacter(id, request, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @DeleteMapping("/{id}")
    public void deleteCharacter(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String username = authentication.getName();
        characterService.deleteCharacter(id, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @GetMapping("/campaign/{campaignId}/admin")
    public List<CharacterDTO> getAllCharactersByCampaignForMaster(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return characterService.getAllCharactersByCampaignForMaster(campaignId, username);
    }
}