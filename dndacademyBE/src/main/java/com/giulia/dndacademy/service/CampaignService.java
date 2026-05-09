package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.dto.PartyMemberDTO;

import java.util.List;

public interface CampaignService {

    CampaignDTO createCampaign(String name, String description, String username);

    List<CampaignDTO> getAllCampaigns();

    CampaignDTO joinCampaign(Long campaignId, String username);

    List<String> getPlayers(Long campaignId, String username);

    List<PartyMemberDTO> getParty(Long campaignId, String username);
}