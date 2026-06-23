package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignProgressDTO;

import java.util.List;

public interface CampaignProgressService {

    List<CampaignProgressDTO> getMyCampaignProgress(String username);

    void completeCampaignIfAllChaptersCompleted(Long campaignId, String username);

}