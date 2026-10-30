package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CombatServiceImplTest {
    @Mock CharacterRepository characters;
    @Mock CombatRepository combats;
    @Mock UserService users;
    @Mock CampaignChapterRepository chapters;
    @Mock CampaignChapterProgressRepository progress;
    @Mock EncounterRepository encounters;
    @Mock EncounterNpcRepository encounterNpcs;
    @Mock CombatParticipantRepository participants;
    @Mock com.giulia.dndacademy.service.CampaignProgressService campaignProgressService;
    @InjectMocks CombatServiceImpl service;

    Combat combat;
    User user;
    CombatParticipant player, goblin, helper;

    @BeforeEach
    void setup() {
        user = User.builder().id(1L).build();
        Character character = Character.builder().id(10L).name("Aria").player(user)
                .armorClass(12).weaponName("Spada").damageDie(6).attackAbility(AttackAbility.STRENGTH)
                .stats(CharacterStats.builder().strength(14).build()).build();
        combat = Combat.builder().id(1L).user(user)
                .campaign(Campaign.builder().id(1L).build())
                .chapter(CampaignChapter.builder().id(3L).build())
                .encounter(Encounter.builder().id(1L).build())
                .turnOrder(new ArrayList<>(List.of(1L, 2L, 3L))).build();
        player = CombatParticipant.builder().id(1L).combat(combat).character(character)
                .currentHp(20).maxHp(20).alive(true).build();
        goblin = CombatParticipant.builder().id(2L).combat(combat).enemy(true).alive(true)
                .currentHp(30).maxHp(30).npc(Npc.builder().id(20L).name("Goblin").armorClass(10)
                        .attackModifier(2).damageDie(6).damageModifier(1).build()).build();
        helper = CombatParticipant.builder().id(3L).combat(combat).alive(true).currentHp(10).maxHp(10)
                .npc(Npc.builder().id(30L).name("Guida").armorClass(10)
                        .attackModifier(2).damageDie(6).damageModifier(1).build()).build();
        when(users.getByUsername("player")).thenReturn(user);
        when(combats.findLockedById(1L)).thenReturn(Optional.of(combat));
        lenient().when(combats.findById(1L)).thenReturn(Optional.of(combat));
        lenient().when(participants.findByCombatId(1L)).thenReturn(List.of(player, goblin, helper));
        for (CombatParticipant p : List.of(player, goblin, helper))
            lenient().when(participants.findById(p.getId())).thenReturn(Optional.of(p));
    }

    private void withRolls(int d20, Runnable action) {
        ThreadLocalRandom random = mock(ThreadLocalRandom.class);
        try (MockedStatic<ThreadLocalRandom> mocked = mockStatic(ThreadLocalRandom.class)) {
            mocked.when(ThreadLocalRandom::current).thenReturn(random);
            when(random.nextInt(1, 21)).thenReturn(d20);
            lenient().when(random.nextInt(1, 7)).thenReturn(4);
            action.run();
        }
    }

    @Test void playerAttackStopsBeforeGoblinTurn() {
        AttackRequest request = new AttackRequest();
        request.setCombatId(1L); request.setAttackerId(1L); request.setTargetId(2L);
        request.setActionType(CombatActionType.WEAPON);
        withRolls(15, () -> service.attack(request, "player"));
        assertEquals(1, combat.getCurrentTurnIndex());
        assertEquals(20, player.getCurrentHp());
        assertEquals(1, combat.getEvents().size());
        assertEquals(24, goblin.getCurrentHp());
    }

    @Test void goblinDamageIsRecordedAndOnlyOneNpcActs() {
        combat.setCurrentTurnIndex(1);
        withRolls(15, () -> {
            CombatStatusDTO status = service.advanceNpcTurn(1L, 0, "player");
            assertEquals(3L, status.getCurrentTurnParticipantId());
        });
        assertEquals(15, player.getCurrentHp());
        CombatEvent event = combat.getEvents().get(0);
        assertTrue(event.isHit());
        assertEquals(20, event.getTargetHpBefore());
        assertEquals(15, event.getTargetRemainingHp());
        assertEquals(5, event.getDamage());
        assertEquals(1, combat.getEvents().size());
    }

    @Test void naturalOneMissesWithoutChangingHp() {
        combat.setCurrentTurnIndex(1);
        withRolls(1, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(20, player.getCurrentHp());
        assertFalse(combat.getEvents().get(0).isHit());
        assertEquals(0, combat.getEvents().get(0).getDamage());
    }

    @Test void criticalDefeatEndsCombatWhenNoAlliesRemain() {
        combat.setCurrentTurnIndex(1);
        player.setCurrentHp(5);
        helper.setAlive(false);
        withRolls(20, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(0, player.getCurrentHp());
        assertFalse(player.isAlive());
        assertTrue(combat.isCompleted());
        assertEquals(CombatOutcome.ENEMY_VICTORY, combat.getOutcome());
        assertTrue(combat.getEvents().get(0).isCritical());
        assertEquals(9, combat.getEvents().get(0).getDamage());
    }

    @Test void helperAttacksEnemyAndReturnsTurnToPlayer() {
        combat.setCurrentTurnIndex(2);
        withRolls(15, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(25, goblin.getCurrentHp());
        assertEquals(0, combat.getCurrentTurnIndex());
        assertFalse(combat.getEvents().get(0).isEnemy());
        assertEquals(goblin.getId(), combat.getEvents().get(0).getTargetId());
    }

    @Test void duplicateRequestCannotResolveAnotherTurn() {
        combat.setCurrentTurnIndex(1);
        combat.getEvents().add(new CombatEvent());
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(409, error.getStatusCode().value());
        verify(participants, never()).save(any());
    }

    @Test void cannotAdvancePlayerTurnOrAnotherUsersCombat() {
        assertThrows(ResponseStatusException.class, () -> service.advanceNpcTurn(1L, 0, "player"));
        combat.setUser(User.builder().id(99L).build());
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(403, error.getStatusCode().value());
    }

    private void healer() {
        combat.setCurrentTurnIndex(2);
        helper.getNpc().setHealer(true);
        helper.getNpc().setHealingDie(6);
        helper.getNpc().setHealingModifier(2);
        helper.getNpc().setHealingUses(2);
    }

    private void withHealingRoll(Runnable action) {
        ThreadLocalRandom random = mock(ThreadLocalRandom.class);
        try (MockedStatic<ThreadLocalRandom> mocked = mockStatic(ThreadLocalRandom.class)) {
            mocked.when(ThreadLocalRandom::current).thenReturn(random);
            when(random.nextInt(1, 7)).thenReturn(4);
            action.run();
        }
    }

    @Test void healerRestoresHpRecordsActualHealingAndConsumesOneUse() {
        healer(); player.setCurrentHp(10);
        withHealingRoll(() -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(16, player.getCurrentHp());
        assertEquals(1, helper.getHealingUsed());
        assertEquals(0, combat.getCurrentTurnIndex());
        CombatEvent event = combat.getEvents().get(0);
        assertEquals("HEAL", event.getActionType());
        assertEquals(6, event.getHealing());
        assertEquals(0, event.getDamage());
        assertEquals(10, event.getTargetHpBefore());
        assertEquals(16, event.getTargetRemainingHp());
        assertEquals(4, event.getHealingRoll());
        assertEquals(6, event.getHealingDie());
        assertEquals(30, goblin.getCurrentHp());
    }

    @Test void healerRescuesFallenPlayerBeforeWoundedHelperAndReturnsTheirTurn() {
        healer(); player.setCurrentHp(0); player.setAlive(false); helper.setCurrentHp(1);
        withHealingRoll(() -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(6, player.getCurrentHp());
        assertTrue(player.isAlive());
        assertEquals(1, helper.getCurrentHp());
        assertEquals(0, combat.getCurrentTurnIndex());
        assertFalse(combat.isCompleted());
    }

    @Test void healingIsClampedAtMaxHpAndNotAppliedToAnEnemy() {
        healer(); player.setCurrentHp(19); goblin.setCurrentHp(1);
        withHealingRoll(() -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(20, player.getCurrentHp());
        assertEquals(1, combat.getEvents().get(0).getHealing());
        assertEquals(1, goblin.getCurrentHp());
    }

    @Test void healerCanHealItselfWhenItHasLowestHpRatio() {
        healer(); helper.setCurrentHp(2); player.setCurrentHp(19);
        withHealingRoll(() -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(8, helper.getCurrentHp());
        assertEquals(helper.getId(), combat.getEvents().get(0).getTargetId());
    }

    @Test void exhaustedHealerAttacksAndDoesNotRescueOrConsumeMoreUses() {
        healer(); helper.setHealingUsed(2); player.setCurrentHp(0); player.setAlive(false);
        withRolls(15, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(0, player.getCurrentHp());
        assertEquals(25, goblin.getCurrentHp());
        assertEquals(2, helper.getHealingUsed());
        assertNotEquals("HEAL", combat.getEvents().get(0).getActionType());
    }

    @Test void healerAttacksWithoutConsumingUsesIfEveryoneIsHealthy() {
        healer();
        withRolls(15, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(25, goblin.getCurrentHp());
        assertEquals(0, helper.getHealingUsed());
    }

    @Test void replayingHealingRequestCannotHealOrSpendASecondUse() {
        healer(); player.setCurrentHp(10);
        withHealingRoll(() -> service.advanceNpcTurn(1L, 0, "player"));
        assertThrows(ResponseStatusException.class, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertEquals(16, player.getCurrentHp());
        assertEquals(1, helper.getHealingUsed());
        assertEquals(1, combat.getEvents().size());
    }

    @Test void livingHelperCanWinForGroupWithPlayerStillAtZeroHp() {
        combat.setCurrentTurnIndex(2); player.setCurrentHp(0); player.setAlive(false); goblin.setCurrentHp(1);
        withRolls(15, () -> service.advanceNpcTurn(1L, 0, "player"));
        assertTrue(combat.isCompleted());
        assertEquals(CombatOutcome.PLAYER_VICTORY, combat.getOutcome());
        assertEquals(0, player.getCurrentHp());
    }
}
