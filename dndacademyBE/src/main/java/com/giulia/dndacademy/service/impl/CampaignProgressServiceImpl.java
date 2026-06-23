package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignProgressDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.CampaignChapterProgress;
import com.giulia.dndacademy.model.CampaignProgress;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import com.giulia.dndacademy.repository.CampaignChapterProgressRepository;
import com.giulia.dndacademy.repository.CampaignProgressRepository;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.service.CampaignProgressService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignProgressServiceImpl implements CampaignProgressService {

    private final CampaignRepository campaignRepository;
    private final CampaignProgressRepository campaignProgressRepository;
    private final CampaignChapterProgressRepository campaignChapterProgressRepository;
    private final UserService userService;

    @Override
    public List<CampaignProgressDTO> getMyCampaignProgress(String username) {
        User user = userService.getByUsername(username);

        List<Campaign> campaigns = campaignRepository.findAll();

        ensureProgressExistsForUser(user, campaigns);

        return campaignProgressRepository.findByUserIdOrderByCampaignIdAsc(user.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public void completeCampaignIfAllChaptersCompleted(Long campaignId, String username) {
        User user = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        CampaignProgress progress = campaignProgressRepository
                .findByUserIdAndCampaignId(user.getId(), campaignId)
                .orElseGet(() -> createProgressForCampaign(user, campaign));

        if (!progress.isUnlocked()) {
            throw new RuntimeException("Questa campagna non è ancora sbloccata");
        }

        if (progress.isCompleted()) {
            return;
        }

        List<CampaignChapterProgress> chapterProgresses =
                campaignChapterProgressRepository
                        .findByUserIdAndChapterCampaignIdOrderByChapterOrderIndexAsc(
                                user.getId(),
                                campaignId
                        );

        if (chapterProgresses.isEmpty()) {
            throw new RuntimeException("La campagna non ha capitoli completabili");
        }

        boolean allChaptersCompleted = chapterProgresses.stream()
                .allMatch(CampaignChapterProgress::isCompleted);

        if (!allChaptersCompleted) {
            return;
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        campaignProgressRepository.save(progress);

        unlockNextDifficultyCampaigns(user, campaign.getDifficulty());
    }

    private void ensureProgressExistsForUser(User user, List<Campaign> campaigns) {
        for (Campaign campaign : campaigns) {
            boolean alreadyExists = campaignProgressRepository
                    .existsByUserIdAndCampaignId(user.getId(), campaign.getId());

            if (!alreadyExists) {
                CampaignProgress progress = createProgressForCampaign(user, campaign);
                campaignProgressRepository.save(progress);
            }
        }
    }

    private CampaignProgress createProgressForCampaign(User user, Campaign campaign) {
        boolean unlockedByDefault = campaign.getDifficulty() == CampaignDifficulty.BEGINNER;

        return CampaignProgress.builder()
                .user(user)
                .campaign(campaign)
                .unlocked(unlockedByDefault)
                .completed(false)
                .completedAt(null)
                .build();
    }

    private void unlockNextDifficultyCampaigns(
            User user,
            CampaignDifficulty completedDifficulty
    ) {
        CampaignDifficulty nextDifficulty = getNextDifficulty(completedDifficulty);

        if (nextDifficulty == null) {
            return;
        }

        List<Campaign> campaignsToUnlock = campaignRepository.findByDifficulty(nextDifficulty);

        for (Campaign campaign : campaignsToUnlock) {
            CampaignProgress progress = campaignProgressRepository
                    .findByUserIdAndCampaignId(user.getId(), campaign.getId())
                    .orElseGet(() -> createLockedProgressForCampaign(user, campaign));

            progress.setUnlocked(true);

            campaignProgressRepository.save(progress);
        }
    }

    private CampaignProgress createLockedProgressForCampaign(User user, Campaign campaign) {
        return CampaignProgress.builder()
                .user(user)
                .campaign(campaign)
                .unlocked(false)
                .completed(false)
                .completedAt(null)
                .build();
    }

    private CampaignDifficulty getNextDifficulty(CampaignDifficulty currentDifficulty) {
        if (currentDifficulty == CampaignDifficulty.BEGINNER) {
            return CampaignDifficulty.INTERMEDIATE;
        }

        if (currentDifficulty == CampaignDifficulty.INTERMEDIATE) {
            return CampaignDifficulty.ADVANCED;
        }

        return null;
    }

    private CampaignProgressDTO mapToDTO(CampaignProgress progress) {
        Campaign campaign = progress.getCampaign();

        return CampaignProgressDTO.builder()
                .campaignId(campaign.getId())
                .campaignName(campaign.getName())
                .campaignDescription(campaign.getDescription())
                .difficulty(campaign.getDifficulty())
                .unlocked(progress.isUnlocked())
                .completed(progress.isCompleted())
                .completedAt(progress.getCompletedAt())
                .build();
    }

}