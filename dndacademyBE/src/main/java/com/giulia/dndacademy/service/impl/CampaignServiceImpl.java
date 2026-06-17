package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignDTO;
import com.giulia.dndacademy.dto.PartyMemberDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CombatRepository;
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
    private final CharacterRepository characterRepository;
    private final CombatRepository combatRepository;

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
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

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
    public List<String> getPlayers(Long campaignId, String username) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Nessuna campagna trovata"));

        checkCampaignAccess(campaign, username);

        return campaign.getPlayers()
                .stream()
                .map(User::getUsername)
                .toList();
    }

    @Override
    public List<PartyMemberDTO> getParty(Long campaignId, String username) {

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Nessuna campagna trovata"));

        checkCampaignAccess(campaign, username);

        return characterRepository.findByCampaignIdAndPlayerIsNotNull(campaignId)
                .stream()
                .map(c -> PartyMemberDTO.builder()
                        .playerUsername(c.getPlayer().getUsername())
                        .characterName(c.getName())
                        .characterClass(c.getCharacterClass())
                        .level(c.getLevel())
                        .build())
                .toList();
    }

    private CampaignDTO mapToDTO(Campaign campaign) {
        return CampaignDTO.builder()
                .id(campaign.getId())
                .name(campaign.getName())
                .description(campaign.getDescription())
                .masterUsername(campaign.getMaster().getUsername())
                .build();
    }

    private void checkCampaignAccess(Campaign campaign, String username) {
        User user = userService.getByUsername(username);

        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }
    }

    @Override
    public CampaignDTO updateCampaign(Long campaignId, String name, String description, String username) {
        User master = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        boolean isCampaignMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi modificare solo le campagne create da te");
        }

        if (name == null || name.isBlank()) {
            throw new RuntimeException("Il nome della campagna è obbligatorio");
        }

        if (description == null || description.isBlank()) {
            throw new RuntimeException("La descrizione della campagna è obbligatoria");
        }

        campaign.setName(name.trim());
        campaign.setDescription(description.trim());

        Campaign saved = campaignRepository.save(campaign);

        return mapToDTO(saved);
    }

    @Override
    public void deleteCampaign(Long campaignId, String username) {
        User master = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        boolean isCampaignMaster = campaign.getMaster().getId().equals(master.getId());

        if (!isCampaignMaster) {
            throw new RuntimeException("Puoi eliminare solo le campagne create da te");
        }

        if (!characterRepository.findByCampaignId(campaignId).isEmpty()) {
            throw new RuntimeException(
                    "Non puoi eliminare una campagna che contiene personaggi"
            );
        }

        if (!combatRepository.findByCampaignId(campaignId).isEmpty()) {
            throw new RuntimeException(
                    "Non puoi eliminare una campagna che contiene combattimenti"
            );
        }

        campaignRepository.delete(campaign);
    }
}