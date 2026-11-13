package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JwtSecurityConfigurationTest {
    @Autowired ApplicationContext context;
    @Autowired SecurityFilterChain chain;
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper json;

    @Test
    void noDefaultUserServiceOrAlternativePasswordFiltersAreInstalled() {
        assertTrue(context.getBeansOfType(UserDetailsService.class).isEmpty());
        assertFalse(context.containsBean("inMemoryUserDetailsManager"));
        assertTrue(chain.getFilters().stream().noneMatch(filter ->
                filter instanceof BasicAuthenticationFilter
                        || filter instanceof UsernamePasswordAuthenticationFilter));
    }

    @Test
    void databaseLoginIssuesJwtAndAuthenticatesTheActualPlayer() throws Exception {
        User player = createPlayer();
        var response = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", player.getUsername(), "password", "ValidPassword1!"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token").isString())
                .andReturn().getResponse();
        String token = json.readTree(response.getContentAsString()).get("token").asText();
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(player.getId()))
                .andExpect(jsonPath("$.username").value(player.getUsername()))
                .andExpect(jsonPath("$.role").value("PLAYER"));
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", player.getUsername(), "password", "WrongPassword1!"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void basicCredentialsCannotReplaceBearerAuthentication() throws Exception {
        User player = createPlayer();
        String credentials = Base64.getEncoder().encodeToString(
                (player.getUsername() + ":ValidPassword1!").getBytes(StandardCharsets.UTF_8));
        mvc.perform(get("/api/users/me").header("Authorization", "Basic " + credentials))
                .andExpect(status().is4xxClientError())
                .andExpect(header().doesNotExist("WWW-Authenticate"));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me"))
                .andExpect(status().is4xxClientError());
    }

    private User createPlayer() {
        String key = "jwt_" + UUID.randomUUID().toString().substring(0, 12);
        return users.save(User.builder().username(key).email(key + "@example.test")
                .password(encoder.encode("ValidPassword1!"))
                .role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
    }
}
