package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CombatHistoryTest {
    @Mock CharacterRepository characters;
    @Mock CombatRepository combats;
    @Mock UserService users;
    @Mock CampaignChapterRepository chapters;
    @Mock CampaignChapterProgressRepository chapterProgress;
    @Mock EncounterRepository encounters;
    @Mock EncounterNpcRepository encounterNpcs;
    @Mock CombatParticipantRepository participants;
    @InjectMocks CombatServiceImpl service;
    User user;

    @BeforeEach void setup() { user = User.builder().id(7L).build(); }

    Combat combat(long id, boolean completed, CombatOutcome outcome) {
        return Combat.builder().id(id).user(user).completed(completed).outcome(outcome)
                .campaign(Campaign.builder().id(1L).name("Miniere").build())
                .chapter(CampaignChapter.builder().id(3L).title("Agguato").build())
                .encounter(Encounter.builder().id(4L).title("Due goblin").build()).build();
    }

    @Test void historyIsScopedToCurrentUserAndUsesSavedCharacterHp() {
        when(users.getByUsername("player")).thenReturn(user);
        Combat saved = combat(101, true, CombatOutcome.PLAYER_VICTORY);
        saved.setCompletedAt(LocalDateTime.of(2026, 10, 29, 10, 0));
        Pageable request = PageRequest.of(0, 12, Sort.by("id").descending());
        when(combats.findByUserId(7L, request)).thenReturn(new PageImpl<>(List.of(saved), request, 1));
        Character character = Character.builder().name("Seraphina").imageUrl("https://example.test/hero.png")
                .currentHp(12).build();
        CombatParticipant participant = CombatParticipant.builder().combat(saved).character(character)
                .currentHp(9).maxHp(12).build();
        when(participants.findByCombatIdInAndCharacterIsNotNull(List.of(101L))).thenReturn(List.of(participant));

        var result = service.getMyHistory("player", 0, 12);

        assertEquals(1, result.getTotalElements());
        assertEquals("Miniere", result.getItems().get(0).getCampaignName());
        assertEquals("Agguato", result.getItems().get(0).getChapterTitle());
        assertEquals("Seraphina", result.getItems().get(0).getCharacterName());
        assertEquals(9, result.getItems().get(0).getCharacterCurrentHp());
        assertEquals(CombatOutcome.PLAYER_VICTORY, result.getItems().get(0).getOutcome());
        verify(combats).findByUserId(7L, request);
        verify(combats, never()).save(any());
        verify(participants, never()).save(any());
    }

    @Test void emptyHistoryDoesNotFetchParticipants() {
        when(users.getByUsername("player")).thenReturn(user);
        when(combats.findByUserId(eq(7L), any())).thenReturn(Page.empty(PageRequest.of(0, 12)));
        var result = service.getMyHistory("player", 0, 12);
        assertTrue(result.getItems().isEmpty());
        assertEquals(0, result.getTotalElements());
        verifyNoInteractions(participants);
    }

    @Test void paginationReturnsOnlyRequestedPageAndPreservesTotals() {
        when(users.getByUsername("player")).thenReturn(user);
        Pageable request = PageRequest.of(1, 1, Sort.by("id").descending());
        when(combats.findByUserId(7L, request)).thenReturn(new PageImpl<>(List.of(combat(100, true, CombatOutcome.ENEMY_VICTORY)), request, 3));
        var result = service.getMyHistory("player", 1, 1);
        assertEquals(1, result.getPage());
        assertEquals(1, result.getSize());
        assertEquals(3, result.getTotalPages());
        assertEquals(3, result.getTotalElements());
        assertEquals(100L, result.getItems().get(0).getCombatId());
        verify(participants).findByCombatIdInAndCharacterIsNotNull(List.of(100L));
    }

    @Test void invalidPaginationIsRejectedBeforeReadingAnyUserData() {
        for (int[] invalid : new int[][]{{-1, 12}, {0, 0}, {0, -1}, {0, 51}}) {
            var error = assertThrows(ResponseStatusException.class, () -> service.getMyHistory("player", invalid[0], invalid[1]));
            assertEquals(400, error.getStatusCode().value());
        }
        verifyNoInteractions(users, combats, participants);
    }

    @Test void ongoingCombatHasNoInventedOutcomeOrDate() {
        when(users.getByUsername("player")).thenReturn(user);
        Combat ongoing = combat(101, false, null);
        when(combats.findByUserId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(ongoing)));
        var entry = service.getMyHistory("player", 0, 12).getItems().get(0);
        assertFalse(entry.isCompleted());
        assertNull(entry.getOutcome());
        assertNull(entry.getCompletedAt());
    }

    @Test void olderEntriesWithMissingMetadataRemainReadableInTheList() {
        when(users.getByUsername("player")).thenReturn(user);
        Combat older = Combat.builder().id(2L).user(user).completed(true).build();
        when(combats.findByUserId(eq(7L), any())).thenReturn(new PageImpl<>(List.of(older)));
        var entry = service.getMyHistory("player", 0, 12).getItems().get(0);
        assertEquals("Combattimento", entry.getEncounterTitle());
        assertEquals("Campagna non disponibile", entry.getCampaignName());
        assertNull(entry.getCharacterName());
        assertNull(entry.getCompletedAt());
        when(combats.findById(2L)).thenReturn(Optional.of(older));
        var detail = service.getCombatStatus(2L, "player");
        assertEquals(2L, detail.getCombatId());
        assertTrue(detail.getFighters().isEmpty());
        assertTrue(detail.getEvents().isEmpty());
    }

    @Test void readingAnotherUsersCombatDetailsIsForbidden() {
        when(users.getByUsername("player")).thenReturn(user);
        Combat foreign = combat(101, true, CombatOutcome.PLAYER_VICTORY);
        foreign.setUser(User.builder().id(99L).build());
        when(combats.findById(101L)).thenReturn(Optional.of(foreign));
        var error = assertThrows(ResponseStatusException.class, () -> service.getCombatStatus(101L, "player"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(participants);
    }
}
