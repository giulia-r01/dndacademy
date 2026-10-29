package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignProgressDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.CampaignProgress;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import com.giulia.dndacademy.repository.CampaignChapterProgressRepository;
import com.giulia.dndacademy.repository.CampaignChapterRepository;
import com.giulia.dndacademy.repository.CampaignProgressRepository;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.service.CampaignProgressService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignProgressServiceImpl implements CampaignProgressService {

    private final CampaignRepository campaignRepository;
    private final CampaignProgressRepository campaignProgressRepository;
    private final CampaignChapterProgressRepository campaignChapterProgressRepository;
    private final CampaignChapterRepository campaignChapterRepository;
    private final UserService userService;

    @Override
    @Transactional
    public List<CampaignProgressDTO> getMyCampaignProgress(String username) {
        User user = userService.getByUsername(username);

        List<Campaign> campaigns = campaignRepository.findAll();

        ensureProgressExistsForUser(user, campaigns);

        List<CampaignProgress> progresses = campaignProgressRepository
                .findByUserIdOrderByCampaignIdAsc(user.getId());
        // Validate all completions before deriving eligibility: a newly added chapter
        // can invalidate an old completion even if its campaign appears later in the list.
        progresses.forEach(this::reopenIfCurrentChaptersIncomplete);
        Set<CampaignDifficulty> completedDifficulties = progresses.stream()
                .filter(CampaignProgress::isCompleted)
                .map(progress -> progress.getCampaign().getDifficulty())
                .collect(Collectors.toSet());
        for (CampaignProgress progress : progresses) {
            CampaignDifficulty difficulty = progress.getCampaign().getDifficulty();
            boolean eligible = difficulty == CampaignDifficulty.BEGINNER
                    || completedDifficulties.stream().anyMatch(completed -> getNextDifficulty(completed) == difficulty);
            if (!progress.isUnlocked() && eligible) {
                progress.setUnlocked(true);
                campaignProgressRepository.save(progress);
            }
        }

        return progresses.stream().map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional
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

        long chapterCount = campaignChapterRepository.countByCampaignId(campaignId);
        if (chapterCount == 0) {
            throw new RuntimeException("La campagna non ha capitoli completabili");
        }

        boolean allChaptersCompleted = completedChapterCount(progress) == chapterCount;

        if (!allChaptersCompleted) {
            reopen(progress);
            return;
        }

        if (progress.isCompleted()) return;

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        campaignProgressRepository.save(progress);

        unlockNextDifficultyCampaigns(user, campaign.getDifficulty());
    }

    private long completedChapterCount(CampaignProgress progress) {
        return campaignChapterProgressRepository.countByUserIdAndChapterCampaignIdAndCompletedTrue(
                progress.getUser().getId(), progress.getCampaign().getId());
    }

    private void reopenIfCurrentChaptersIncomplete(CampaignProgress progress) {
        if (!progress.isCompleted()) return;
        long chapterCount = campaignChapterRepository.countByCampaignId(progress.getCampaign().getId());
        // Compare against current chapters, including those without a progress row yet.
        if (chapterCount == 0 || completedChapterCount(progress) != chapterCount) reopen(progress);
    }

    private void reopen(CampaignProgress progress) {
        if (!progress.isCompleted()) return;
        progress.setCompleted(false);
        progress.setCompletedAt(null);
        campaignProgressRepository.save(progress);
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

        User user = progress.getUser();

        boolean joined = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        return CampaignProgressDTO.builder()
                .campaignId(campaign.getId())
                .campaignName(campaign.getName())
                .campaignDescription(campaign.getDescription())
                .difficulty(campaign.getDifficulty())
                .unlocked(progress.isUnlocked())
                .joined(joined)
                .completed(progress.isCompleted())
                .completedAt(progress.getCompletedAt())
                .build();
    }

}
