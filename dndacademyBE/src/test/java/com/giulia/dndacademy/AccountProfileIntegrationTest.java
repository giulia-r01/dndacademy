package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.security.JwtTool;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AccountProfileIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired BadgeRepository badges;
    @Autowired UserBadgeRepository ownedBadges;
    @Autowired PasswordResetTokenRepository resetTokens;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtTool jwt;
    @Autowired BadgeService badgeService;
    @MockitoBean ImageUploadService images;
    @MockitoBean EmailService emails;
    User account;
    String token;
    final String originalPassword = "Original1!";

    @BeforeEach void setup() {
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        account = users.saveAndFlush(User.builder().username("player" + suffix).email(suffix + "@example.test")
                .password(passwords.encode(originalPassword)).role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
        token = jwt.generateToken(account);
    }
    String body(Object request) throws Exception { return json.writeValueAsString(request); }
    void resetLink() {
        resetTokens.saveAndFlush(PasswordResetToken.builder().user(account).token("reset-" + account.getId())
                .expirationDate(LocalDateTime.now().plusMinutes(20)).used(false).build());
    }

    @Test void usernameAndEmailUpdateKeepIdentitySessionAndProgress() throws Exception {
        badgeService.assignSystemBadge(account.getUsername(), SystemBadge.FIRST_QUIZ);
        resetLink();
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", "renamed" + account.getId(), "email", "NEW" + account.getId() + "@example.test", "currentPassword", originalPassword))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("new" + account.getId() + "@example.test"))
                .andExpect(jsonPath("$.role").value("PLAYER"));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value("renamed" + account.getId()));
        mvc.perform(get("/api/badges/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Primo Quiz"));
        assertTrue(resetTokens.findByUserId(account.getId()).isEmpty());
    }

    @Test void profileRejectsWrongPasswordDuplicateEmailAndRoleEscalation() throws Exception {
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", "changed", "email", "changed@example.test", "currentPassword", "wrong"))))
                .andExpect(status().isBadRequest());
        User other = users.saveAndFlush(User.builder().username("another" + account.getId()).email("taken@example.test")
                .password("unused").role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", account.getUsername(), "email", "TAKEN@example.test", "currentPassword", originalPassword))))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", other.getUsername(), "email", account.getEmail(), "currentPassword", originalPassword))))
                .andExpect(status().isConflict());
        mvc.perform(patch("/api/users/me").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", account.getUsername(), "email", account.getEmail(), "currentPassword", originalPassword, "role", "MASTER", "learningLevel", "ADVANCED"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("PLAYER"))
                .andExpect(jsonPath("$.learningLevel").value("BEGINNER"));
    }

    @Test void passwordChangeRevokesAllExistingTokensAndResetLinks() throws Exception {
        String anotherSession = jwt.generateToken(account);
        resetLink();
        mvc.perform(put("/api/users/me/password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("currentPassword", originalPassword, "newPassword", "Replacement2!"))))
                .andExpect(status().isNoContent());
        for (String oldToken : List.of(token, anotherSession))
            mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + oldToken)).andExpect(status().isUnauthorized());
        assertTrue(resetTokens.findByUserId(account.getId()).isEmpty());
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", account.getUsername(), "password", originalPassword)))).andExpect(status().isUnauthorized());
        String login = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("username", account.getUsername(), "password", "Replacement2!"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + json.readTree(login).get("token").asText())).andExpect(status().isOk());
    }

    @Test void passwordRulesMatchRegisterResetAndProfileIncludingBcryptByteLimit() throws Exception {
        resetLink();
        for (String invalid : List.of("short", "lowercase1!", "NoDigitsHere", "A1" + "x".repeat(71), "A1" + "\u00e8".repeat(36))) {
            mvc.perform(put("/api/users/me/password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                    .content(body(Map.of("currentPassword", originalPassword, "newPassword", invalid)))).andExpect(status().isBadRequest());
            mvc.perform(post("/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                    .content(body(Map.of("token", "reset-" + account.getId(), "newPassword", invalid)))).andExpect(status().isBadRequest());
            mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                    .content(body(Map.of("username", "validname", "email", "valid@example.test", "password", invalid)))).andExpect(status().isBadRequest());
        }
        mvc.perform(put("/api/users/me/password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("currentPassword", "incorrect", "newPassword", "Replacement2!")))).andExpect(status().isBadRequest());
        mvc.perform(put("/api/users/me/password").header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON)
                .content(body(Map.of("currentPassword", originalPassword, "newPassword", originalPassword)))).andExpect(status().isBadRequest());
        assertEquals(0, account.getTokenVersion());
    }

    @Test void passwordResetRevokesSessionsAndCannotBeReplayed() throws Exception {
        resetLink();
        String request = body(Map.of("token", "reset-" + account.getId(), "newPassword", "Replacement2!"));
        mvc.perform(post("/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isOk());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/reset-password").contentType(MediaType.APPLICATION_JSON).content(request)).andExpect(status().isBadRequest());
    }

    @Test void avatarUploadAndRemovalOnlyChangeAuthenticatedAccount() throws Exception {
        when(images.uploadUserImage(any(), eq(account.getId()))).thenReturn("https://example.test/avatar.png");
        mvc.perform(multipart("/api/users/me/avatar").file(new MockMultipartFile("file", "avatar.png", "image/png", new byte[]{1, 2}))
                .with(request -> { request.setMethod("PUT"); return request; }).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.avatarUrl").value("https://example.test/avatar.png"));
        mvc.perform(delete("/api/users/me/avatar").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.avatarUrl").isEmpty());
        verify(images).deleteUserImage(account.getId());
    }

    @Test void playerCatalogIncludesLockedAndOwnedBadgesWithoutAdminMetadata() throws Exception {
        badgeService.assignSystemBadge(account.getUsername(), SystemBadge.FIRST_QUIZ);
        badgeService.assignSystemBadge(account.getUsername(), SystemBadge.FIRST_QUIZ);
        assertEquals(1, ownedBadges.findByUserUsername(account.getUsername()).size());
        mvc.perform(get("/api/badges/catalog").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.unlocked == true)]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.unlocked == false)]").isNotEmpty())
                .andExpect(jsonPath("$[0].assignedToUsers").doesNotExist());
        mvc.perform(get("/api/badges").header("Authorization", "Bearer " + token)).andExpect(status().isForbidden());
    }

    @Test void systemBadgesSurviveRenameAndCannotBeDeleted() throws Exception {
        Badge first = badges.findBySystemCode(SystemBadge.FIRST_QUIZ).orElseThrow();
        first.setName("Nuovo titolo " + account.getId());
        badges.saveAndFlush(first);
        badgeService.assignSystemBadge(account.getUsername(), SystemBadge.FIRST_QUIZ);
        assertEquals(first.getId(), ownedBadges.findByUserUsername(account.getUsername()).get(0).getBadge().getId());
        account.setRole(Role.MASTER); users.saveAndFlush(account);
        mvc.perform(delete("/api/badges/" + first.getId()).header("Authorization", "Bearer " + token)).andExpect(status().isConflict());
    }
}
