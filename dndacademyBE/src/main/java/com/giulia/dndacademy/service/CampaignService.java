package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.dto.CreateCampaignRequest;
import com.giulia.dndacademy.dto.PartyMemberDTO;

import java.util.List;

public interface CampaignService {

    CampaignDTO createCampaign(CreateCampaignRequest request, String username);

    List<CampaignDTO> getAllCampaigns();

    CampaignDTO joinCampaign(Long campaignId, String username);

    List<String> getPlayers(Long campaignId, String username);

    List<PartyMemberDTO> getParty(Long campaignId, String username);

    CampaignDTO updateCampaign(Long campaignId, CreateCampaignRequest request, String username);

    void deleteCampaign(Long campaignId, String username);
}