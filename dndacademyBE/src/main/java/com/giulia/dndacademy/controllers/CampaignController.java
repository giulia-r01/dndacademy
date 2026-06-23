package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.dto.CreateCampaignRequest;
import com.giulia.dndacademy.dto.PartyMemberDTO;
import com.giulia.dndacademy.service.CampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping
    public CampaignDTO createCampaign(
            @RequestBody CreateCampaignRequest request,
            Authentication authentication
    ) {

        String username = authentication.getName();

        return campaignService.createCampaign(request, username);
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
    public List<String> getPlayers(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return campaignService.getPlayers(id, username);
    }


    @GetMapping("/{campaignId}/party")
    public List<PartyMemberDTO> getParty(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return campaignService.getParty(campaignId, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PutMapping("/{id}")
    public CampaignDTO updateCampaign(
            @PathVariable Long id,
            @RequestBody CreateCampaignRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignService.updateCampaign(id, request, username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @DeleteMapping("/{id}")
    public void deleteCampaign(
            @PathVariable Long id,
            Authentication authentication
    ) {
        String username = authentication.getName();

        campaignService.deleteCampaign(id, username);
    }
}