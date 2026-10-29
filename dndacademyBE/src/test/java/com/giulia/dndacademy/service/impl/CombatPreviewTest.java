package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CombatPreviewTest {
    @Mock CharacterRepository characters;
    @Mock CombatRepository combats;
    @Mock UserService users;
    @Mock CampaignChapterRepository chapters;
    @Mock CampaignChapterProgressRepository progress;
    @Mock EncounterRepository encounters;
    @Mock EncounterNpcRepository encounterNpcs;
    @Mock CombatParticipantRepository participants;
    @InjectMocks CombatServiceImpl service;
    CampaignChapter chapter;
    User player;
    Encounter encounter;

    @BeforeEach void setup() {
        player = User.builder().id(1L).build();
        Campaign campaign = Campaign.builder().id(1L).name("Miniere").players(List.of(player)).build();
        chapter = CampaignChapter.builder().id(3L).campaign(campaign).title("Agguato").hasCombat(true).build();
        encounter = Encounter.builder().id(8L).chapter(chapter).title("I goblin del sentiero").description("Due ombre nel bosco").build();
        when(users.getByUsername("player")).thenReturn(player);
        when(chapters.findById(3L)).thenReturn(Optional.of(chapter));
    }
    void unlock() {
        when(progress.findByUserIdAndChapterId(1L, 3L))
                .thenReturn(Optional.of(CampaignChapterProgress.builder().unlocked(true).build()));
    }
    EncounterNpc configuredNpc(boolean enemy, int quantity) {
        return EncounterNpc.builder().encounter(encounter).quantity(quantity)
                .npc(Npc.builder().id(enemy ? 20L : 30L).name(enemy ? "Goblin" : "Guida")
                        .imageUrl("https://example.test/portrait.png").description("Descrizione")
                        .enemy(enemy).maxHp(15).armorClass(13).dexterity(12)
                        .attackModifier(2).damageDie(6).damageModifier(1).build()).build();
    }

    @Test void previewShowsExactEncounterWithEnemyQuantitiesAlliesAndImagesWithoutStartingCombat() {
        unlock();
        when(encounters.findFirstByChapterIdOrderByIdAsc(3L)).thenReturn(Optional.of(encounter));
        when(encounterNpcs.findByEncounterId(8L)).thenReturn(List.of(configuredNpc(true, 2), configuredNpc(false, 1)));
        var result = service.getChapterPreview(3L, "player");
        assertEquals(1L, result.getCampaignId());
        assertEquals("Miniere", result.getCampaignName());
        assertEquals("I goblin del sentiero", result.getTitle());
        assertEquals(2, result.getParticipants().get(0).getQuantity());
        assertTrue(result.getParticipants().get(0).getNpc().isEnemy());
        assertEquals(15, result.getParticipants().get(0).getNpc().getMaxHp());
        assertEquals(13, result.getParticipants().get(0).getNpc().getArmorClass());
        assertEquals("https://example.test/portrait.png", result.getParticipants().get(0).getNpc().getImageUrl());
        assertFalse(result.getParticipants().get(1).getNpc().isEnemy());
        verifyNoInteractions(characters, combats, participants);
    }

    @Test void previewDoesNotExposeAnotherCampaignEncounter() {
        chapter.getCampaign().setPlayers(List.of());
        var error = assertThrows(ResponseStatusException.class, () -> service.getChapterPreview(3L, "player"));
        assertEquals(403, error.getStatusCode().value());
        verifyNoInteractions(encounters, encounterNpcs, combats, participants);
    }

    @Test void previewAndStartBothRejectLockedChapter() {
        when(progress.findByUserIdAndChapterId(1L, 3L)).thenReturn(Optional.empty());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.getChapterPreview(3L, "player")).getStatusCode().value());
        assertEquals(403, assertThrows(ResponseStatusException.class,
                () -> service.startChapterCombat(3L, "player")).getStatusCode().value());
        verifyNoInteractions(encounters, encounterNpcs, characters, combats, participants);
    }

    @Test void chapterWithoutCombatHasNoPreview() {
        chapter.setHasCombat(false);
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> service.getChapterPreview(3L, "player")).getStatusCode().value());
        verifyNoInteractions(encounters, encounterNpcs, combats, participants);
    }

    @Test void missingEncounterHasPlayerFacingMessage() {
        unlock();
        when(encounters.findFirstByChapterIdOrderByIdAsc(3L)).thenReturn(Optional.empty());
        var error = assertThrows(ResponseStatusException.class, () -> service.getChapterPreview(3L, "player"));
        assertEquals(400, error.getStatusCode().value());
        assertEquals("Questo incontro non è ancora disponibile", error.getReason());
        verifyNoInteractions(combats, participants);
    }

    @Test void encounterWithoutEnemiesOrWithInvalidQuantityCannotBePreviewed() {
        unlock();
        when(encounters.findFirstByChapterIdOrderByIdAsc(3L)).thenReturn(Optional.of(encounter));
        when(encounterNpcs.findByEncounterId(8L)).thenReturn(List.of(configuredNpc(false, 1)))
                .thenReturn(List.of(configuredNpc(true, 0)));
        assertThrows(ResponseStatusException.class, () -> service.getChapterPreview(3L, "player"));
        assertThrows(ResponseStatusException.class, () -> service.getChapterPreview(3L, "player"));
        verifyNoInteractions(combats, participants);
    }
}
