package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.dto.CreateCampaignRequest;
import com.giulia.dndacademy.service.CampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    public CampaignDTO createCampaign(
            @RequestBody CreateCampaignRequest request,
            Authentication authentication
    ) {

        String username = authentication.getName();

        return campaignService.createCampaign(
                request.getName(),
                request.getDescription(),
                username
        );
    }

    @GetMapping
    public List<CampaignDTO> getAllCampaigns() {
        return campaignService.getAllCampaigns();
    }

    @PostMapping("/{id}/join")
    public CampaignDTO joinCampaign(
            @PathVariable Long id,
            Authentication authentication
    ) {

        String username = authentication.getName();

        return campaignService.joinCampaign(id, username);
    }

    @GetMapping("/{id}/players")
    public List<String> getPlayers(@PathVariable Long id) {
        return campaignService.getPlayers(id);
    }

    @GetMapping("/roles")
    public Object roles(Authentication auth) {
        return auth.getAuthorities();
    }
}