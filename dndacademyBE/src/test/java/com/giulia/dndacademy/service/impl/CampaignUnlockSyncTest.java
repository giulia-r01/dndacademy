package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.CampaignProgress;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CampaignUnlockSyncTest {
    @Mock CampaignRepository campaigns;
    @Mock CampaignProgressRepository progresses;
    @Mock CampaignChapterProgressRepository chapterProgresses;
    @Mock CampaignChapterRepository chapters;
    @Mock UserService users;
    @InjectMocks CampaignProgressServiceImpl service;
    User user = User.builder().id(1L).username("player").build();
    List<CampaignProgress> saved = new ArrayList<>();
    LocalDateTime completedAt = LocalDateTime.of(2026, 10, 29, 12, 0);

    @BeforeEach void setup() {
        when(users.getByUsername("player")).thenReturn(user);
        when(progresses.findByUserIdOrderByCampaignIdAsc(1L)).thenAnswer(invocation -> saved);
    }

    private Campaign campaign(long id, CampaignDifficulty difficulty) {
        return Campaign.builder().id(id).name("Campaign " + id).difficulty(difficulty).players(List.of()).build();
    }

    private CampaignProgress existing(Campaign campaign, boolean unlocked, boolean completed) {
        CampaignProgress progress = CampaignProgress.builder().user(user).campaign(campaign)
                .unlocked(unlocked).completed(completed).completedAt(completed ? completedAt : null).build();
        saved.add(progress);
        when(progresses.existsByUserIdAndCampaignId(1L, campaign.getId())).thenReturn(true);
        if (completed) {
            when(chapters.countByCampaignId(campaign.getId())).thenReturn(2L);
            when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, campaign.getId())).thenReturn(2L);
        }
        return progress;
    }

    @Test void campaignCreatedAfterPrerequisiteCompletionIsUnlockedOnFirstRead() {
        Campaign beginner = campaign(10, CampaignDifficulty.BEGINNER);
        Campaign intermediate = campaign(20, CampaignDifficulty.INTERMEDIATE);
        CampaignProgress completed = existing(beginner, true, true);
        when(campaigns.findAll()).thenReturn(List.of(beginner, intermediate));
        when(progresses.save(any())).thenAnswer(invocation -> {
            CampaignProgress progress = invocation.getArgument(0);
            if (!saved.contains(progress)) saved.add(progress);
            return progress;
        });

        var result = service.getMyCampaignProgress("player");

        assertTrue(result.get(1).isUnlocked());
        assertFalse(result.get(1).isJoined());
        assertFalse(result.get(1).isCompleted());
        assertNull(result.get(1).getCompletedAt());
        assertEquals(completedAt, completed.getCompletedAt());
        verify(progresses, never()).findByUserIdOrderByCampaignIdAsc(2L);
    }

    @Test void existingLockedRowIsRepairedAndRepeatedReadDoesNotRewriteIt() {
        Campaign beginner = campaign(10, CampaignDifficulty.BEGINNER);
        Campaign intermediate = campaign(20, CampaignDifficulty.INTERMEDIATE);
        existing(beginner, true, true);
        CampaignProgress locked = existing(intermediate, false, false);
        when(campaigns.findAll()).thenReturn(List.of(beginner, intermediate));
        assertTrue(service.getMyCampaignProgress("player").get(1).isUnlocked());
        assertTrue(service.getMyCampaignProgress("player").get(1).isUnlocked());
        verify(progresses, times(1)).save(locked);
    }

    @Test void noCompletedPrerequisiteKeepsIntermediateLocked() {
        Campaign intermediate = campaign(20, CampaignDifficulty.INTERMEDIATE);
        existing(intermediate, false, false);
        when(campaigns.findAll()).thenReturn(List.of(intermediate));
        assertFalse(service.getMyCampaignProgress("player").get(0).isUnlocked());
        verify(progresses, never()).save(any());
    }

    @Test void beginnerCompletionDoesNotSkipIntermediateForAdvanced() {
        Campaign beginner = campaign(10, CampaignDifficulty.BEGINNER);
        Campaign advanced = campaign(30, CampaignDifficulty.ADVANCED);
        existing(beginner, true, true);
        existing(advanced, false, false);
        when(campaigns.findAll()).thenReturn(List.of(beginner, advanced));
        assertFalse(service.getMyCampaignProgress("player").get(1).isUnlocked());
        verify(progresses, never()).save(any());
    }

    @Test void completedIntermediateUnlocksAdvanced() {
        Campaign intermediate = campaign(20, CampaignDifficulty.INTERMEDIATE);
        Campaign advanced = campaign(30, CampaignDifficulty.ADVANCED);
        existing(intermediate, true, true);
        CampaignProgress locked = existing(advanced, false, false);
        when(campaigns.findAll()).thenReturn(List.of(intermediate, advanced));
        assertTrue(service.getMyCampaignProgress("player").get(1).isUnlocked());
        verify(progresses).save(locked);
    }

    @Test void staleCompletionIsReopenedBeforeUnlockEvenWhenItIsLastInTheList() {
        Campaign intermediate = campaign(10, CampaignDifficulty.INTERMEDIATE);
        Campaign beginner = campaign(20, CampaignDifficulty.BEGINNER);
        CampaignProgress locked = existing(intermediate, false, false);
        CampaignProgress stale = existing(beginner, true, true);
        when(chapterProgresses.countByUserIdAndChapterCampaignIdAndCompletedTrue(1L, 20L)).thenReturn(1L);
        when(campaigns.findAll()).thenReturn(List.of(intermediate, beginner));
        var result = service.getMyCampaignProgress("player");
        assertFalse(result.get(0).isUnlocked());
        assertFalse(result.get(1).isCompleted());
        verify(progresses, never()).save(locked);
        verify(progresses).save(stale);
    }
}
