package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignChapterDTO;
import com.giulia.dndacademy.dto.CreateCampaignChapterRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.CampaignChapterService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignChapterServiceImpl implements CampaignChapterService {

    private final CampaignChapterRepository campaignChapterRepository;
    private final CampaignRepository campaignRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final BadgeRepository badgeRepository;
    private final UserService userService;

    @Override
    public CampaignChapterDTO createChapter(
            Long campaignId,
            CreateCampaignChapterRequest request,
            String username
    ) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignMaster(campaign, username);

        validateRequest(request);

        if (campaignChapterRepository.existsByCampaignIdAndOrderIndex(
                campaignId,
                request.getOrderIndex()
        )) {
            throw new RuntimeException("Esiste già un capitolo con questo ordine nella campagna");
        }

        Lesson lesson = getLessonOrNull(request.getLessonId());
        Quiz quiz = getQuizOrNull(request.getQuizId());
        Badge rewardBadge = getBadgeOrNull(request.getRewardBadgeId());

        CampaignChapter chapter = CampaignChapter.builder()
                .campaign(campaign)
                .title(request.getTitle().trim())
                .description(trimOrNull(request.getDescription()))
                .storyText(request.getStoryText().trim())
                .orderIndex(request.getOrderIndex())
                .hasCombat(request.isHasCombat())
                .lesson(lesson)
                .quiz(quiz)
                .rewardBadge(rewardBadge)
                .build();

        CampaignChapter saved = campaignChapterRepository.save(chapter);

        return mapToDTO(saved);
    }

    @Override
    public List<CampaignChapterDTO> getChaptersByCampaign(
            Long campaignId,
            String username
    ) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new RuntimeException("Campagna non trovata"));

        checkCampaignAccess(campaign, username);

        return campaignChapterRepository.findByCampaignIdOrderByOrderIndexAsc(campaignId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public CampaignChapterDTO updateChapter(
            Long chapterId,
            CreateCampaignChapterRequest request,
            String username
    ) {
        CampaignChapter chapter = campaignChapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Capitolo non trovato"));

        checkCampaignMaster(chapter.getCampaign(), username);

        validateRequest(request);

        boolean orderAlreadyUsed = campaignChapterRepository
                .findByCampaignIdOrderByOrderIndexAsc(chapter.getCampaign().getId())
                .stream()
                .anyMatch(existingChapter ->
                        existingChapter.getOrderIndex() == request.getOrderIndex()
                                && !existingChapter.getId().equals(chapterId)
                );

        if (orderAlreadyUsed) {
            throw new RuntimeException("Esiste già un altro capitolo con questo ordine nella campagna");
        }

        Lesson lesson = getLessonOrNull(request.getLessonId());
        Quiz quiz = getQuizOrNull(request.getQuizId());
        Badge rewardBadge = getBadgeOrNull(request.getRewardBadgeId());

        chapter.setTitle(request.getTitle().trim());
        chapter.setDescription(trimOrNull(request.getDescription()));
        chapter.setStoryText(request.getStoryText().trim());
        chapter.setOrderIndex(request.getOrderIndex());
        chapter.setHasCombat(request.isHasCombat());
        chapter.setLesson(lesson);
        chapter.setQuiz(quiz);
        chapter.setRewardBadge(rewardBadge);

        CampaignChapter saved = campaignChapterRepository.save(chapter);

        return mapToDTO(saved);
    }

    @Override
    public void deleteChapter(Long chapterId, String username) {
        CampaignChapter chapter = campaignChapterRepository.findById(chapterId)
                .orElseThrow(() -> new RuntimeException("Capitolo non trovato"));

        checkCampaignMaster(chapter.getCampaign(), username);

        campaignChapterRepository.delete(chapter);
    }

    private void validateRequest(CreateCampaignChapterRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new RuntimeException("Il titolo del capitolo è obbligatorio");
        }

        if (request.getStoryText() == null || request.getStoryText().isBlank()) {
            throw new RuntimeException("Il testo narrativo è obbligatorio");
        }

        if (request.getOrderIndex() < 1) {
            throw new RuntimeException("L'ordine del capitolo deve essere almeno 1");
        }
    }

    private void checkCampaignMaster(Campaign campaign, String username) {
        User user = userService.getByUsername(username);

        boolean isMaster = campaign.getMaster().getId().equals(user.getId());

        if (!isMaster) {
            throw new RuntimeException("Puoi gestire solo capitoli delle tue campagne");
        }
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

    private Lesson getLessonOrNull(Long lessonId) {
        if (lessonId == null) {
            return null;
        }

        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata"));
    }

    private Quiz getQuizOrNull(Long quizId) {
        if (quizId == null) {
            return null;
        }

        return quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trovato"));
    }

    private Badge getBadgeOrNull(Long badgeId) {
        if (badgeId == null) {
            return null;
        }

        return badgeRepository.findById(badgeId)
                .orElseThrow(() -> new RuntimeException("Badge non trovato"));
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private CampaignChapterDTO mapToDTO(CampaignChapter chapter) {
        return CampaignChapterDTO.builder()
                .id(chapter.getId())
                .campaignId(chapter.getCampaign().getId())
                .campaignName(chapter.getCampaign().getName())
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
                .build();
    }
}