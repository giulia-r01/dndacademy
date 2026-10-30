package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CharacterStatsDTO;
import com.giulia.dndacademy.dto.UpdateCharacterRequest;
import com.giulia.dndacademy.model.Campaign;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.AttackAbility;
import com.giulia.dndacademy.repository.CampaignRepository;
import com.giulia.dndacademy.repository.CharacterRepository;
import com.giulia.dndacademy.repository.CharacterStatsRepository;
import com.giulia.dndacademy.service.CombatService;
import com.giulia.dndacademy.service.ImageUploadService;
import com.giulia.dndacademy.service.UserService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class CharacterHpUpdateTest {
    @ParameterizedTest(name = "assigned={0}, current={1}, max={2} => HP {3}")
    @CsvSource({
            "false, 14, 15, 15",
            "false, 14, 10, 10",
            "false, 14, 14, 14",
            "false, 13, 14, 14",
            "true,  14, 15, 14",
            "true,  14, 10, 10",
            "true,   0, 15,  0"
    })
    void hpUpdateRespectsAssignment(boolean assigned, int currentHp, int newMaxHp, int expectedHp) {
        CharacterRepository characters = mock(CharacterRepository.class);
        UserService users = mock(UserService.class);
        CharacterServiceImpl service = new CharacterServiceImpl(characters,
                mock(CharacterStatsRepository.class), mock(CampaignRepository.class), users,
                mock(CombatService.class), mock(ImageUploadService.class),
                mock(com.giulia.dndacademy.repository.CombatParticipantRepository.class),
                mock(com.giulia.dndacademy.service.CampaignProgressService.class));
        User master = User.builder().id(1L).username("master").build();
        Character character = Character.builder().id(10L).name("Thorin")
                .campaign(Campaign.builder().id(2L).master(master).build())
                .player(assigned ? User.builder().id(3L).username("player").build() : null)
                .maxHp(14).currentHp(currentHp).imageUrl("https://example.test/thorin.png")
                .build();
        when(users.getByUsername("master")).thenReturn(master);
        when(characters.findLockedById(10L)).thenReturn(Optional.of(character));
        when(characters.save(character)).thenReturn(character);
        UpdateCharacterRequest request = new UpdateCharacterRequest();
        request.setName("Thorin");
        request.setRace("Nano");
        request.setCharacterClass("Guerriero");
        request.setLevel(1);
        request.setMaxHp(newMaxHp);
        request.setArmorClass(16);
        request.setWeaponName("Ascia da battaglia");
        request.setDamageDie(10);
        request.setAttackAbility(AttackAbility.STRENGTH);
        request.setStats(new CharacterStatsDTO(16, 12, 14, 10, 12, 10));

        var result = service.updateCharacter(10L, request, "master");

        assertEquals(newMaxHp, result.getMaxHp());
        assertEquals(expectedHp, result.getCurrentHp());
        assertEquals(expectedHp, character.getCurrentHp());
        assertEquals("https://example.test/thorin.png", result.getImageUrl());
        verify(characters).save(character);
    }
}
