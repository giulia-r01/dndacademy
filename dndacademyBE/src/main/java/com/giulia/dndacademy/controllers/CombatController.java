package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CombatDTO;
import com.giulia.dndacademy.dto.CombatStatusDTO;
import com.giulia.dndacademy.service.CombatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/combat")
@RequiredArgsConstructor
public class CombatController {

    private final CombatService combatService;

    @PostMapping("/start/{campaignId}")
    public CombatDTO startCombat(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        return combatService.startCombat(campaignId, authentication.getName());
    }

    @GetMapping("/{combatId}/current")
    public Long currentTurn(
            @PathVariable Long combatId,
            Authentication authentication
    ) {
        return combatService.getCurrentTurn(combatId, authentication.getName());
    }

    @PostMapping("/{combatId}/next")
    public void nextTurn(
            @PathVariable Long combatId,
            Authentication authentication
    ) {
        combatService.nextTurn(combatId, authentication.getName());
    }

    @GetMapping("/{combatId}/status")
    public CombatStatusDTO getCombatStatus(
            @PathVariable Long combatId,
            Authentication authentication
    ) {
        return combatService.getCombatStatus(combatId, authentication.getName());
    }
}