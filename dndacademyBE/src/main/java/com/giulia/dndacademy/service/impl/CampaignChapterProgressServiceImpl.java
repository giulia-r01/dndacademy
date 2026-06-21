package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignChapterPlayerDTO;
import com.giulia.dndacademy.dto.CampaignChapterProgressDTO;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.CampaignChapter;
import com.giulia.dndacademy.model.CampaignChapterProgress;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.CampaignChapterProgressRepository;
import com.giulia.dndacademy.repository.CampaignChapterRepository;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.service.CampaignChapterProgressService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.service.BadgeService;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignChapterProgressServiceImpl
        implements CampaignChapterProgressService {

    private final CampaignRepository campaignRepository;
    private final CampaignChapterRepository campaignChapterRepository;
    private final CampaignChapterProgressRepository progressRepository;
    private final UserService userService;
    private final BadgeService badgeService;

    @Override
    public List<CampaignChapterProgressDTO> getProgressByCampaign(
            Long campaignId,
            String username
    ) {
        User user = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, user);

        List<CampaignChapter> chapters = campaignChapterRepository
                .findByCampaignIdOrderByOrderIndexAsc(campaignId);

        ensureProgressExistsForCampaign(user, chapters);

        return progressRepository
                .findByUserIdAndChapterCampaignIdOrderByChapterOrderIndexAsc(
                        user.getId(),
                        campaignId
                )
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private void assignRewardBadgeIfPresent(
            CampaignChapter chapter,
            String username
    ) {
        if (chapter.getRewardBadge() == null) {
            return;
        }

        badgeService.assignBadge(
                username,
                chapter.getRewardBadge().getName()
        );
    }

    @Override
    public CampaignChapterProgressDTO completeChapter(
            Long chapterId,
            String username
    ) {
        User user = userService.getByUsername(username);

        CampaignChapter chapter = campaignChapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Capitolo non trovato"));

        checkCampaignAccess(chapter.getCampaign(), user);

        List<CampaignChapter> chapters = campaignChapterRepository
                .findByCampaignIdOrderByOrderIndexAsc(chapter.getCampaign().getId());

        ensureProgressExistsForCampaign(user, chapters);

        CampaignChapterProgress progress = progressRepository
                .findByUserIdAndChapterId(user.getId(), chapterId)
                .orElseThrow(() -> new RuntimeException("Progressione capitolo non trovata"));

        if (!progress.isUnlocked()) {
            throw new RuntimeException("Questo capitolo non è ancora sbloccato");
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        CampaignChapterProgress saved = progressRepository.save(progress);

        assignRewardBadgeIfPresent(chapter, username);

        unlockNextChapterIfExists(user, chapters, chapter);

        return mapToDTO(saved);
    }

    private void ensureProgressExistsForCampaign(
            User user,
            List<CampaignChapter> chapters
    ) {
        if (chapters.isEmpty()) {
            return;
        }

        List<CampaignChapter> orderedChapters = chapters.stream()
                .sorted(Comparator.comparingInt(CampaignChapter::getOrderIndex))
                .toList();

        for (int i = 0; i < orderedChapters.size(); i++) {
            CampaignChapter chapter = orderedChapters.get(i);

            boolean alreadyExists = progressRepository.existsByUserIdAndChapterId(
                    user.getId(),
                    chapter.getId()
            );

            if (!alreadyExists) {
                CampaignChapterProgress progress = CampaignChapterProgress.builder()
                        .user(user)
                        .chapter(chapter)
                        .unlocked(i == 0)
                        .completed(false)
                        .completedAt(null)
                        .build();

                progressRepository.save(progress);
            }
        }
    }

    private void unlockNextChapterIfExists(
            User user,
            List<CampaignChapter> chapters,
            CampaignChapter completedChapter
    ) {
        List<CampaignChapter> orderedChapters = chapters.stream()
                .sorted(Comparator.comparingInt(CampaignChapter::getOrderIndex))
                .toList();

        for (int i = 0; i < orderedChapters.size(); i++) {
            CampaignChapter currentChapter = orderedChapters.get(i);

            if (
                    currentChapter.getId().equals(completedChapter.getId())
                            && i + 1 < orderedChapters.size()
            ) {
                CampaignChapter nextChapter = orderedChapters.get(i + 1);

                CampaignChapterProgress nextProgress = progressRepository
                        .findByUserIdAndChapterId(user.getId(), nextChapter.getId())
                        .orElseThrow(() -> new RuntimeException("Progressione capitolo successivo non trovata"));

                nextProgress.setUnlocked(true);

                progressRepository.save(nextProgress);

                return;
            }
        }
    }

    private void checkCampaignAccess(Campaign campaign, User user) {
        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        boolean isPlayer = campaign.getPlayers()
                .stream()
                .anyMatch(player -> player.getId().equals(user.getId()));

        if (!isMaster && !isPlayer) {
            throw new RuntimeException("Non fai parte di questa campagna");
        }
    }

    private CampaignChapterProgressDTO mapToDTO(CampaignChapterProgress progress) {
        return CampaignChapterProgressDTO.builder()
                .chapterId(progress.getChapter().getId())
                .chapterTitle(progress.getChapter().getTitle())
                .orderIndex(progress.getChapter().getOrderIndex())
                .unlocked(progress.isUnlocked())
                .completed(progress.isCompleted())
                .completedAt(progress.getCompletedAt())
                .build();
    }

    private CampaignChapterPlayerDTO mapToPlayerDTO(CampaignChapterProgress progress) {
        CampaignChapter chapter = progress.getChapter();

        return CampaignChapterPlayerDTO.builder()
                .chapterId(chapter.getId())
                .campaignId(chapter.getCampaign().getId())
                .title(chapter.getTitle())
                .description(chapter.getDescription())
                .storyText(chapter.getStoryText())
                .orderIndex(chapter.getOrderIndex())
                .hasCombat(chapter.isHasCombat())
                .lessonId(chapter.getLesson() != null ? chapter.getLesson().getId() : null)
                .lessonTitle(chapter.getLesson() != null ? chapter.getLesson().getTitle() : null)
                .quizId(chapter.getQuiz() != null ? chapter.getQuiz().getId() : null)
                .quizTitle(chapter.getQuiz() != null ? chapter.getQuiz().getTitle() : null)
                .rewardBadgeId(chapter.getRewardBadge() != null ? chapter.getRewardBadge().getId() : null)
                .rewardBadgeName(chapter.getRewardBadge() != null ? chapter.getRewardBadge().getName() : null)
                .unlocked(progress.isUnlocked())
                .completed(progress.isCompleted())
                .completedAt(progress.getCompletedAt())
                .build();
    }

    @Override
    public List<CampaignChapterPlayerDTO> getPlayerChaptersByCampaign(
            Long campaignId,
            String username
    ) {
        User user = userService.getByUsername(username);

        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, user);

        List<CampaignChapter> chapters = campaignChapterRepository
                .findByCampaignIdOrderByOrderIndexAsc(campaignId);

        ensureProgressExistsForCampaign(user, chapters);

        List<CampaignChapterProgress> progressList = progressRepository
                .findByUserIdAndChapterCampaignIdOrderByChapterOrderIndexAsc(
                        user.getId(),
                        campaignId
                );

        return progressList.stream()
                .map(this::mapToPlayerDTO)
                .toList();
    }
}