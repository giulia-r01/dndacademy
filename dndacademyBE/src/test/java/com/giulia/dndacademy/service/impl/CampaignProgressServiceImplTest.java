package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignProgressServiceImplTest {
    @Mock CampaignRepository campaigns;
    @Mock CampaignProgressRepository progresses;
    @Mock CampaignChapterProgressRepository chapterProgresses;
    @Mock CampaignChapterRepository chapters;
    @Mock UserService users;
    @InjectMocks CampaignProgressServiceImpl service;

    User user;
    Campaign campaign;
    CampaignProgress progress;
    LocalDateTime originalDate = LocalDateTime.of(2026, 10, 15, 12, 0);

    @BeforeEach void setup() {
        user = User.builder().id(1L).username("player").build();
        campaign = Campaign.builder().id(10L).name("Miniere")
                .difficulty(CampaignDifficulty.BEGINNER).players(List.of(user)).build();
        progress = CampaignProgress.builder().id(100L).user(user).campaign(campaign)
                .unlocked(true).completed(true).completedAt(originalDate).build();
        when(users.getByUsername("player")).thenReturn(user);
    }

    private void listSetup() {
        when(campaigns.findAll()).thenReturn(List.of(campaign));
        when(progresses.existsByUserIdAndCampaignId(1L, 10L)).thenReturn(true);
        when(progresses.findByUserIdOrderByCampaignIdAsc(1L)).thenReturn(List.of(progress));
    }

    private void completionSetup(long total, long completed) {
        when(campaigns.findById(10L)).thenReturn(Optional.of(campaign));
        when(progresses.findByUserIdAndCampaignId(1L, 10L)).thenReturn(Optional.of(progress));
        when(chapters.countByCampaignId(10L)).thenReturn(total);
        if (total > 0) when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, 10L))
                .thenReturn(completed);
    }

    @Test void campaignListReopensCompletionWhenANewChapterHasNoProgressYet() {
        listSetup();
        when(chapters.countByCampaignId(10L)).thenReturn(3L);
        when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, 10L)).thenReturn(2L);

        var dto = service.getMyCampaignProgress("player").get(0);

        assertFalse(dto.isCompleted());
        assertNull(dto.getCompletedAt());
        assertTrue(dto.isJoined());
        assertTrue(dto.isUnlocked());
        verify(progresses).save(progress);
        verify(chapterProgresses, never()).save(any());
    }

    @Test void unchangedCompletedCampaignKeepsItsOriginalDate() {
        listSetup();
        when(chapters.countByCampaignId(10L)).thenReturn(3L);
        when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, 10L)).thenReturn(3L);
        var dto = service.getMyCampaignProgress("player").get(0);
        assertTrue(dto.isCompleted());
        assertEquals(originalDate, dto.getCompletedAt());
        verify(progresses, never()).save(any());
    }

    @Test void completingOnlyExistingProgressRowsCannotFinishCampaignWithANewChapter() {
        progress.setCompleted(false);
        progress.setCompletedAt(null);
        completionSetup(3, 2);
        service.completeCampaignIfAllChaptersCompleted(10L, "player");
        assertFalse(progress.isCompleted());
        assertNull(progress.getCompletedAt());
        verify(progresses, never()).save(any());
        verify(campaigns, never()).findByDifficulty(any());
    }

    @Test void completionOperationAlsoRepairsAnAlreadyCompletedFlag() {
        completionSetup(3, 2);
        service.completeCampaignIfAllChaptersCompleted(10L, "player");
        assertFalse(progress.isCompleted());
        assertNull(progress.getCompletedAt());
        verify(progresses).save(progress);
    }

    @Test void finishingTheAddedChapterCompletesCampaignAndUnlocksNextDifficulty() {
        progress.setCompleted(false);
        progress.setCompletedAt(null);
        completionSetup(3, 3);
        Campaign nextCampaign = Campaign.builder().id(20L).difficulty(CampaignDifficulty.INTERMEDIATE).build();
        CampaignProgress nextProgress = CampaignProgress.builder().user(user).campaign(nextCampaign).unlocked(false).build();
        when(campaigns.findByDifficulty(CampaignDifficulty.INTERMEDIATE)).thenReturn(List.of(nextCampaign));
        when(progresses.findByUserIdAndCampaignId(1L, 20L)).thenReturn(Optional.of(nextProgress));

        service.completeCampaignIfAllChaptersCompleted(10L, "player");

        assertTrue(progress.isCompleted());
        assertNotNull(progress.getCompletedAt());
        assertTrue(nextProgress.isUnlocked());
        verify(progresses).save(progress);
        verify(progresses).save(nextProgress);
    }

    @Test void reopeningDoesNotRevokeUnlockedCampaigns() {
        Campaign nextCampaign = Campaign.builder().id(20L).players(List.of(user))
                .difficulty(CampaignDifficulty.INTERMEDIATE).build();
        CampaignProgress nextProgress = CampaignProgress.builder().user(user).campaign(nextCampaign)
                .unlocked(true).completed(false).build();
        when(campaigns.findAll()).thenReturn(List.of(campaign, nextCampaign));
        when(progresses.existsByUserIdAndCampaignId(1L, 10L)).thenReturn(true);
        when(progresses.existsByUserIdAndCampaignId(1L, 20L)).thenReturn(true);
        when(progresses.findByUserIdOrderByCampaignIdAsc(1L)).thenReturn(List.of(progress, nextProgress));
        when(chapters.countByCampaignId(10L)).thenReturn(3L);
        when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, 10L)).thenReturn(2L);

        var result = service.getMyCampaignProgress("player");

        assertFalse(result.get(0).isCompleted());
        assertTrue(result.get(1).isUnlocked());
        verify(progresses, never()).save(nextProgress);
    }

    @Test void emptyCampaignCannotBeCompleted() {
        progress.setCompleted(false);
        completionSetup(0, 0);
        assertThrows(RuntimeException.class, () -> service.completeCampaignIfAllChaptersCompleted(10L, "player"));
        verify(progresses, never()).save(any());
    }

    @Test void completionRemainsIdempotentWhenAllCurrentChaptersAreComplete() {
        completionSetup(3, 3);
        service.completeCampaignIfAllChaptersCompleted(10L, "player");
        assertTrue(progress.isCompleted());
        assertEquals(originalDate, progress.getCompletedAt());
        verify(progresses, never()).save(any());
        verify(campaigns, never()).findByDifficulty(any());
    }
}
