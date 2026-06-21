package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CampaignChapterPlayerDTO;
import com.giulia.dndacademy.dto.CampaignChapterProgressDTO;
import com.giulia.dndacademy.service.CampaignChapterProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignChapterProgressController {

    private final CampaignChapterProgressService campaignChapterProgressService;

    @GetMapping("/{campaignId}/chapters/progress")
    public List<CampaignChapterProgressDTO> getProgressByCampaign(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterProgressService.getProgressByCampaign(
                campaignId,
                username
        );
    }

    @PatchMapping("/chapters/{chapterId}/complete")
    public CampaignChapterProgressDTO completeChapter(
            @PathVariable Long chapterId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterProgressService.completeChapter(
                chapterId,
                username
        );
    }

    @GetMapping("/{campaignId}/chapters/player")
    public List<CampaignChapterPlayerDTO> getPlayerChaptersByCampaign(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterProgressService.getPlayerChaptersByCampaign(
                campaignId,
                username
        );
    }
}