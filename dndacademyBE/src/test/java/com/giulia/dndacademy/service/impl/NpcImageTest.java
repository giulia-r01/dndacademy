package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NpcImageTest {
    @Test void ownerCanAddImageToAnNpcAlreadyUsedInCombat() {
        NpcRepository npcs = mock(NpcRepository.class);
        UserService users = mock(UserService.class);
        ImageUploadService images = mock(ImageUploadService.class);
        CombatParticipantRepository participants = mock(CombatParticipantRepository.class);
        NpcServiceImpl service = new NpcServiceImpl(npcs, mock(EncounterNpcRepository.class), participants, users, images);
        User owner = User.builder().id(1L).build();
        Npc npc = Npc.builder().id(1L).owner(owner).maxHp(15).build();
        var file = new MockMultipartFile("file", "goblin.png", "image/png", new byte[]{1});
        when(users.getByUsername("master")).thenReturn(owner);
        when(npcs.findById(1L)).thenReturn(Optional.of(npc));
        when(npcs.save(npc)).thenReturn(npc);
        when(images.uploadNpcImage(file)).thenReturn("https://example.com/goblin.png");
        assertEquals("https://example.com/goblin.png", service.uploadNpcImage(1L, file, "master").getImageUrl());
        assertEquals(15, npc.getMaxHp());
        verifyNoInteractions(participants);
        when(users.getByUsername("other")).thenReturn(User.builder().id(2L).build());
        assertThrows(ResponseStatusException.class, () -> service.uploadNpcImage(1L, file, "other"));
        verify(images, times(1)).uploadNpcImage(file);
    }
}
