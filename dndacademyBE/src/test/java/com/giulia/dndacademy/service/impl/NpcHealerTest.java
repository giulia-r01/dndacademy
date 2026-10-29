package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.NpcRequest;
import com.giulia.dndacademy.model.Npc;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NpcHealerTest {
    NpcRepository npcs = mock(NpcRepository.class);
    UserService users = mock(UserService.class);
    CombatParticipantRepository participants = mock(CombatParticipantRepository.class);
    NpcServiceImpl service = new NpcServiceImpl(npcs, mock(EncounterNpcRepository.class), participants, users, mock(ImageUploadService.class));
    User owner = User.builder().id(1L).build();
    private NpcRequest request() {
        return NpcRequest.builder().name("Guaritrice").enemy(false).maxHp(12).armorClass(13)
                .dexterity(14).attackModifier(3).damageDie(6).damageModifier(1)
                .healer(true).healingDie(6).healingModifier(2).healingUses(3).build();
    }
    @Test void createStoresAndReturnsHealingConfiguration() {
        when(users.getByUsername("master")).thenReturn(owner);
        when(npcs.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.createNpc(request(), "master");
        assertTrue(result.isHealer());
        assertFalse(result.isEnemy());
        assertEquals(6, result.getHealingDie());
        assertEquals(2, result.getHealingModifier());
        assertEquals(3, result.getHealingUses());
    }
    @ParameterizedTest
    @CsvSource({"true,6,2,3", "false,3,2,3", "false,6,-1,3", "false,6,31,3", "false,6,2,0", "false,6,2,21"})
    void invalidHealingConfigurationIsRejected(boolean enemy, int die, int bonus, int uses) {
        NpcRequest request = request();
        request.setEnemy(enemy); request.setHealingDie(die); request.setHealingModifier(bonus); request.setHealingUses(uses);
        assertThrows(ResponseStatusException.class, () -> service.createNpc(request, "master"));
        verify(npcs, never()).save(any());
    }
    @Test void oldNonHealerRequestsStillWorkAndClearHealingFields() {
        when(npcs.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        NpcRequest request = request(); request.setHealer(false);
        var result = service.createNpc(request, "master");
        assertFalse(result.isHealer());
        assertEquals(0, result.getHealingDie());
        assertEquals(0, result.getHealingModifier());
        assertEquals(0, result.getHealingUses());
    }
    @Test void npcAlreadyUsedInCombatCannotBeConvertedToAHealer() {
        Npc old = Npc.builder().id(20L).owner(owner).build();
        when(users.getByUsername("master")).thenReturn(owner);
        when(npcs.findById(20L)).thenReturn(Optional.of(old));
        when(participants.existsByNpcId(20L)).thenReturn(true);
        var error = assertThrows(ResponseStatusException.class, () -> service.updateNpc(20L, request(), "master"));
        assertEquals(409, error.getStatusCode().value());
        assertFalse(old.isHealer());
        verify(npcs, never()).save(any());
    }
}
