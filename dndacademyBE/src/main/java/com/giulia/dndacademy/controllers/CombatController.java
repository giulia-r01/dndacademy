package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.model.Combat;
import com.giulia.dndacademy.service.CombatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/combat")
@RequiredArgsConstructor
public class CombatController {

    private final CombatService combatService;

    @PostMapping("/start/{campaignId}")
    public Combat startCombat(@PathVariable Long campaignId) {
        return combatService.startCombat(campaignId);
    }

    @GetMapping("/{combatId}/current")
    public Long currentTurn(@PathVariable Long combatId) {
        return combatService.getCurrentTurn(combatId);
    }

    @PostMapping("/{combatId}/next")
    public void nextTurn(@PathVariable Long combatId) {
        combatService.nextTurn(combatId);
    }
}
