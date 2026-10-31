package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserRoleTest {
    UserRepository users = mock(UserRepository.class);
    UserServiceImpl service = new UserServiceImpl(users,
            mock(UserLessonProgressRepository.class), mock(UserQuizResultRepository.class));
    User actor = User.builder().id(1L).username("master").role(Role.MASTER).build();
    User target = User.builder().id(2L).username("player").role(Role.PLAYER).build();

    @BeforeEach void setup() {
        when(users.findByUsername("master")).thenReturn(Optional.of(actor));
        when(users.findById(1L)).thenReturn(Optional.of(actor));
        when(users.findById(2L)).thenReturn(Optional.of(target));
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }
    @Test void masterCanPromoteAndDemoteAnotherUser() {
        assertEquals(Role.MASTER, service.updateRole(2L, Role.MASTER, "master").getRole());
        assertEquals(Role.PLAYER, service.updateRole(2L, Role.PLAYER, "master").getRole());
        verify(users, times(2)).save(target);
    }
    @Test void cannotChangeOwnRole() {
        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateRole(1L, Role.PLAYER, "master"));
        assertEquals(400, error.getStatusCode().value());
        assertEquals(Role.MASTER, actor.getRole());
        verify(users, never()).save(any());
    }
    @Test void playerCannotChangeRoles() {
        actor.setRole(Role.PLAYER);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateRole(2L, Role.MASTER, "master"));
        assertEquals(403, error.getStatusCode().value());
        verify(users, never()).save(any());
    }
    @Test void missingTargetReturnsNotFound() {
        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateRole(99L, Role.MASTER, "master"));
        assertEquals(404, error.getStatusCode().value());
        verify(users, never()).save(any());
    }
    @Test void nullRoleIsRejected() {
        var error = assertThrows(ResponseStatusException.class,
                () -> service.updateRole(2L, null, "master"));
        assertEquals(400, error.getStatusCode().value());
        verify(users, never()).save(any());
    }
}