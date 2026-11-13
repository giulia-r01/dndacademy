package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.security.JwtTool;
import com.giulia.dndacademy.service.ImageUploadService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:cors_review;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class CorsIntegrationTest {
    private static final String ORIGIN = "http://localhost:3000";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtTool tokens;
    @MockitoBean ImageUploadService images;

    @Test
    void localPreflightsWorkForJsonAndAuthenticatedUploadsWithoutLogin() throws Exception {
        for (String origin : new String[] {ORIGIN, "http://127.0.0.1:3000"}) {
            mvc.perform(options("/auth/login").header("Origin", origin)
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "Content-Type"))
                    .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin))
                    .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
            mvc.perform(options("/api/characters/1/image").header("Origin", origin)
                            .header("Access-Control-Request-Method", "PATCH")
                            .header("Access-Control-Request-Headers", "Authorization, Content-Type"))
                    .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", origin))
                    .andExpect(header().string("Access-Control-Allow-Methods", containsString("PATCH")))
                    .andExpect(header().string("Access-Control-Allow-Headers", containsString("Authorization")));
        }
    }

    @Test
    void unconfiguredOriginsAndLegacyPortsAreRejected() throws Exception {
        for (String origin : new String[] {"https://untrusted.example", "https://random-preview.vercel.app",
                "http://localhost:5173", "http://localhost:8080", "null"}) {
            mvc.perform(options("/auth/login").header("Origin", origin)
                            .header("Access-Control-Request-Method", "POST"))
                    .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
            mvc.perform(post("/auth/login").header("Origin", origin).contentType(MediaType.APPLICATION_JSON)
                            .content("{\"username\":\"unused\",\"password\":\"unused\"}"))
                    .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
        }
    }

    @Test
    void unconfiguredMethodsAndHeadersAreRejected() throws Exception {
        mvc.perform(options("/api/users/me").header("Origin", ORIGIN)
                        .header("Access-Control-Request-Method", "TRACE"))
                .andExpect(status().isForbidden());
        mvc.perform(options("/api/users/me").header("Origin", ORIGIN)
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "X-Unconfigured-Header"))
                .andExpect(status().isForbidden());
    }

    @Test
    void frontendCanReadAuthenticationErrorsWithoutGainingAnonymousAccess() throws Exception {
        mvc.perform(get("/api/users/me").header("Origin", ORIGIN)
                        .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
        mvc.perform(get("/api/users/me").header("Origin", ORIGIN))
                .andExpect(status().is4xxClientError())
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
    }

    @Test
    void loginAndBearerRequestsWorkFromTheAllowedFrontend() throws Exception {
        User player = player();
        var login = mvc.perform(post("/auth/login").header("Origin", ORIGIN).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", player.getUsername(), "password", "ValidCorsPassword1!"))))
                .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andReturn().getResponse();
        String token = json.readTree(login.getContentAsString()).path("token").asText();
        mvc.perform(get("/api/users/me").header("Origin", ORIGIN).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(player.getId()))
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void multipartAvatarUploadWorksWithBearerAndTheAllowedOrigin() throws Exception {
        User player = player();
        String imageUrl = "https://res.cloudinary.com/test/image/upload/v1/avatar.png";
        when(images.uploadUserImage(any(), eq(player.getId()))).thenReturn(imageUrl);
        var file = new MockMultipartFile("file", "avatar.png", "image/png", new byte[] {1, 2, 3});
        mvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar").file(file)
                        .header("Origin", ORIGIN).header("Authorization", "Bearer " + tokens.generateToken(player)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.avatarUrl").value(imageUrl))
                .andExpect(header().string("Access-Control-Allow-Origin", ORIGIN));
    }

    @Test
    void requestsWithoutOriginIncludingReadinessStillWork() throws Exception {
        mvc.perform(get("/actuator/health/readiness").servletPath("/actuator/health/readiness"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    private User player() {
        String name = "cors_" + UUID.randomUUID().toString().substring(0, 12);
        return users.save(User.builder().username(name).email(name + "@example.test")
                .password(passwords.encode("ValidCorsPassword1!"))
                .role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
    }
}
