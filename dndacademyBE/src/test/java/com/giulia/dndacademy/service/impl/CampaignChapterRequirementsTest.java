package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CampaignChapterPlayerDTO;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignChapterRequirementsTest {
    @Mock CampaignRepository campaigns;
    @Mock CampaignChapterRepository chapters;
    @Mock CampaignChapterProgressRepository progresses;
    @Mock UserService users;
    @Mock BadgeService badges;
    @Mock UserLessonProgressRepository lessons;
    @Mock UserQuizResultRepository quizzes;
    @Mock CombatRepository combats;
    @Mock CampaignProgressService campaignProgress;
    @InjectMocks CampaignChapterProgressServiceImpl service;

    CampaignChapter chapter;
    CampaignChapterProgress progress;

    @BeforeEach void setup() {
        User player = User.builder().id(1L).username("player").build();
        Campaign campaign = Campaign.builder().id(1L).players(List.of(player))
                .master(User.builder().id(2L).build()).build();
        Lesson lesson = Lesson.builder().id(10L).title("Le basi").build();
        Quiz quiz = Quiz.builder().id(20L).title("Quiz di base").lesson(lesson).build();
        chapter = CampaignChapter.builder().id(3L).campaign(campaign).orderIndex(1)
                .lesson(lesson).quiz(quiz).hasCombat(true).build();
        progress = CampaignChapterProgress.builder().user(player).chapter(chapter)
                .unlocked(true).completed(false).build();
        when(users.getByUsername("player")).thenReturn(player);
        when(campaigns.findById(1L)).thenReturn(Optional.of(campaign));
        when(chapters.findByCampaignIdOrderByOrderIndexAsc(1L)).thenReturn(List.of(chapter));
        when(progresses.findByUserIdAndChapterId(1L, 3L)).thenReturn(Optional.of(progress));
        when(progresses.findByUserIdAndChapterCampaignIdOrderByChapterOrderIndexAsc(1L, 1L))
                .thenReturn(List.of(progress));
    }

    private CampaignChapterPlayerDTO read() {
        return service.getPlayerChaptersByCampaign(1L, "player").get(0);
    }

    @Test void completedLessonAndPassedQuizRemainVisibleBeforeChapterCompletion() {
        when(lessons.existsByUserUsernameAndLessonIdAndCompletedTrue("player", 10L)).thenReturn(true);
        when(quizzes.existsByUserUsernameAndQuizIdAndPassedTrue("player", 20L)).thenReturn(true);
        var dto = read();
        assertTrue(dto.isLessonCompleted());
        assertTrue(dto.isQuizPassed());
        assertFalse(dto.isCombatWon());
        assertFalse(dto.isCompleted());
        assertEquals(10L, dto.getQuizLessonId());
        verify(combats).existsByChapterIdAndUserIdAndCompletedTrueAndOutcome(3L, 1L, CombatOutcome.PLAYER_VICTORY);
        verify(progresses, never()).save(any());
    }

    @Test void pendingRequirementsAreNotMarkedAsDone() {
        var dto = read();
        assertFalse(dto.isLessonCompleted());
        assertFalse(dto.isQuizPassed());
        assertFalse(dto.isCombatWon());
    }

    @Test void eachRequirementUsesItsOwnPersistedProgress() {
        when(lessons.existsByUserUsernameAndLessonIdAndCompletedTrue("player", 10L)).thenReturn(true);
        when(combats.existsByChapterIdAndUserIdAndCompletedTrueAndOutcome(3L, 1L, CombatOutcome.PLAYER_VICTORY))
                .thenReturn(true);
        var dto = read();
        assertTrue(dto.isLessonCompleted());
        assertFalse(dto.isQuizPassed());
        assertTrue(dto.isCombatWon());
        assertFalse(dto.isCompleted());
    }

    @Test void absentRequirementsDoNotTriggerProgressQueries() {
        chapter.setLesson(null);
        chapter.setQuiz(null);
        chapter.setHasCombat(false);
        var dto = read();
        assertFalse(dto.isLessonCompleted());
        assertFalse(dto.isQuizPassed());
        assertFalse(dto.isCombatWon());
        assertNull(dto.getQuizLessonId());
        verifyNoInteractions(lessons, quizzes, combats);
    }

    @Test void quizWithoutChapterLessonStillExposesItsOwnLessonForNavigation() {
        chapter.setLesson(null);
        when(quizzes.existsByUserUsernameAndQuizIdAndPassedTrue("player", 20L)).thenReturn(true);
        var dto = read();
        assertNull(dto.getLessonId());
        assertEquals(10L, dto.getQuizLessonId());
        assertTrue(dto.isQuizPassed());
        verifyNoInteractions(lessons);
    }
}
