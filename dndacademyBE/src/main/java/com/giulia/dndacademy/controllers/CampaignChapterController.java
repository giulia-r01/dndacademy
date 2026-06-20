package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CampaignChapterDTO;
import com.giulia.dndacademy.dto.CreateCampaignChapterRequest;
import com.giulia.dndacademy.service.CampaignChapterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignChapterController {

    private final CampaignChapterService campaignChapterService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping("/{campaignId}/chapters")
    public CampaignChapterDTO createChapter(
            @PathVariable Long campaignId,
            @RequestBody @Valid CreateCampaignChapterRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterService.createChapter(
                campaignId,
                request,
                username
        );
    }

    @GetMapping("/{campaignId}/chapters")
    public List<CampaignChapterDTO> getChaptersByCampaign(
            @PathVariable Long campaignId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterService.getChaptersByCampaign(
                campaignId,
                username
        );
    }

    @PreAuthorize("hasRole('MASTER')")
    @PutMapping("/chapters/{chapterId}")
    public CampaignChapterDTO updateChapter(
            @PathVariable Long chapterId,
            @RequestBody @Valid CreateCampaignChapterRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();

        return campaignChapterService.updateChapter(
                chapterId,
                request,
                username
        );
    }

    @PreAuthorize("hasRole('MASTER')")
    @DeleteMapping("/chapters/{chapterId}")
    public void deleteChapter(
            @PathVariable Long chapterId,
            Authentication authentication
    ) {
        String username = authentication.getName();

        campaignChapterService.deleteChapter(chapterId, username);
    }
}