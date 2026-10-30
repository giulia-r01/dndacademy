package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignProgressDTO;

import java.util.List;

public interface CampaignProgressService {

    void requireUnlocked(Long campaignId, String username);

    List<CampaignProgressDTO> getMyCampaignProgress(String username);

    void completeCampaignIfAllChaptersCompleted(Long campaignId, String username);

}