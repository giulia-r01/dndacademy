package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CampaignProgressDTO;
import com.giulia.dndacademy.service.CampaignProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignProgressController {

    private final CampaignProgressService campaignProgressService;

    @GetMapping("/me/progress")
    public List<CampaignProgressDTO> getMyCampaignProgress(
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignProgressService.getMyCampaignProgress(username);
    }
}