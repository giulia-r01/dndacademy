package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.service.CombatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/combat")
@RequiredArgsConstructor
public class CombatController {
    private final CombatService combatService;

    @GetMapping("/history")
    public CombatHistoryDTO history(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "12") int size,
                                    Authentication authentication) {
        return combatService.getMyHistory(authentication.getName(), page, size);
    }

    @GetMapping("/chapter/{chapterId}/preview")
    public CombatPreviewDTO previewChapterCombat(@PathVariable Long chapterId, Authentication authentication) {
        return combatService.getChapterPreview(chapterId, authentication.getName());
    }
    @PostMapping("/chapter/{chapterId}/start")
    public CombatDTO startChapterCombat(@PathVariable Long chapterId, Authentication authentication) {
        return combatService.startChapterCombat(chapterId, authentication.getName());
    }

    @GetMapping("/{combatId}/current")
    public Long currentTurn(@PathVariable Long combatId, Authentication authentication) {
        return combatService.getCurrentTurn(combatId, authentication.getName());
    }

    @GetMapping("/{combatId}/status")
    public CombatStatusDTO getCombatStatus(@PathVariable Long combatId, Authentication authentication) {
        return combatService.getCombatStatus(combatId, authentication.getName());
    }

    @PostMapping("/{combatId}/attack")
    public AttackResultDTO attack(@PathVariable Long combatId,
                                  @RequestBody
                                  @Valid AttackRequest request, Authentication authentication) {
        if (!combatId.equals(request.getCombatId()))
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "ID combattimento non corrispondente");
        return combatService.attack(request, authentication.getName());
    }

    @PostMapping("/{combatId}/npc-turn")
    public CombatStatusDTO advanceNpcTurn(@PathVariable Long combatId,
                                          @RequestParam int expectedEventCount,
                                          Authentication authentication) {
        return combatService.advanceNpcTurn(combatId, expectedEventCount, authentication.getName());
    }
}
