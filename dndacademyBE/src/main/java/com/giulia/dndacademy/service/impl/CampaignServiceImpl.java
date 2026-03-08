package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.service.CampaignService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignServiceImpl implements CampaignService {

    private final CampaignRepository campaignRepository;
    private final UserService userService;

    @Override
    public CampaignDTO createCampaign(String name, String description, String username) {

        User master = userService.getByUsername(username);

        Campaign campaign = Campaign.builder()
                .name(name)
                .description(description)
                .master(master)
                .build();

        Campaign saved = campaignRepository.save(campaign);

        return CampaignDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .masterUsername(master.getUsername())
                .build();
    }

    @Override
    public List<CampaignDTO> getAllCampaigns() {

        return campaignRepository.findAll()
                .stream()
                .map(c -> CampaignDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .masterUsername(c.getMaster().getUsername())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public CampaignDTO joinCampaign(Long campaignId, String username) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        User player = userService.getByUsername(username);

        if (!campaign.getPlayers().contains(player)) {
            campaign.getPlayers().add(player);
        }

        campaignRepository.save(campaign);

        return CampaignDTO.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .masterUsername(campaign.getMaster().getUsername())
                .build();
    }

    @Override
    public List<String> getPlayers(Long campaignId) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));

        return campaign.getPlayers()
                .stream()
                .map(User::getUsername)
                .toList();
    }
}