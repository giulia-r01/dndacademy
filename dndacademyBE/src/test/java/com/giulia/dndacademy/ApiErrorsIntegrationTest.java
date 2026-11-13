package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.exceptions.ApiException;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.service.LessonService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:api_errors;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@ExtendWith(OutputCaptureExtension.class)
class ApiErrorsIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @MockitoBean LessonService lessons;

    static Stream<Arguments> serviceFailures() {
        return Stream.of(
                Arguments.of(new IllegalStateException("PRIVATE_SQL_DETAIL", new java.sql.SQLException("PRIVATE_PASSWORD")), 500),
                Arguments.of(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "PRIVATE_INTERNAL_REASON"), 500),
                Arguments.of(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PRIVATE_PROVIDER_REASON"), 502),
                Arguments.of(new DataAccessResourceFailureException("PRIVATE_JDBC_URL"), 503),
                Arguments.of(new DataIntegrityViolationException("PRIVATE_CONSTRAINT_NAME"), 409),
                Arguments.of(new org.springframework.http.converter.HttpMessageNotWritableException("PRIVATE_LAZY_PROXY"), 500),
                Arguments.of(new ObjectOptimisticLockingFailureExceptionForTest(), 409));
    }

    private static class ObjectOptimisticLockingFailureExceptionForTest extends OptimisticLockingFailureException {
        ObjectOptimisticLockingFailureExceptionForTest() { super("PRIVATE_LOCK_DETAIL"); }
    }

    @ParameterizedTest
    @MethodSource("serviceFailures")
    void internalFailuresKeepStatusButExposeNoTechnicalDetails(RuntimeException failure, int status) throws Exception {
        when(lessons.getLessonById(99L)).thenThrow(failure);
        safe(get("/api/lessons/99").with(user("reader")), status);
    }

    @Test
    void unexpectedFailureDetailsAreKeptInServerLogs(CapturedOutput output) throws Exception {
        when(lessons.getLessonById(98L)).thenThrow(new IllegalStateException("PRIVATE_SERVER_LOG_MARKER"));
        safe(get("/api/lessons/98").with(user("reader")), 500);
        assertTrue(output.getAll().contains("PRIVATE_SERVER_LOG_MARKER"));
    }

    @Test
    void expectedApplicationMessagesRemainReadable() throws Exception {
        when(lessons.getLessonById(97L)).thenThrow(ApiException.notFound("Lezione non trovata"));
        assertEquals("Lezione non trovata", safe(get("/api/lessons/97").with(user("reader")), 404).path("message").asText());
    }

    @Test
    void malformedJsonAndInvalidPathValuesReturnSafeBadRequests() throws Exception {
        safe(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"PRIVATE_PAYLOAD\","), 400);
        safe(get("/api/lessons/PRIVATE_INVALID_NUMBER").with(user("reader")), 400);
        safe(patch("/api/characters/1/damage").with(user("master").roles("MASTER")), 400);
    }

    @Test
    void unsupportedMethodAndMediaTypeKeepTheirHttpMeaning() throws Exception {
        mvc.perform(post("/api/lessons/99").with(user("reader")))
                .andExpect(status().isMethodNotAllowed()).andExpect(header().exists("Allow"))
                .andExpect(jsonPath("$.message").value("Metodo non consentito."))
                .andExpect(jsonPath("$.detail").doesNotExist());
        safe(post("/auth/login").contentType(MediaType.TEXT_PLAIN).content("PRIVATE_PAYLOAD"), 415);
    }

    @Test
    void unknownPublicRouteReturnsMinimalNotFoundJson() throws Exception {
        safe(get("/auth/not-a-real-route"), 404);
    }

    @Test
    void validationUsesTheAuthoredMessageWithoutEchoingTheRequest() throws Exception {
        JsonNode response = safe(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", "", "email", "valid@example.test", "password", "PRIVATE_Password1!"))), 400);
        assertTrue(response.path("message").asText().contains("Username"));
    }

    @Test
    void duplicateRegistrationIsAConflictInsteadOfAnInternalError() throws Exception {
        User player = player();
        JsonNode response = safe(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", player.getUsername(), "email", "other@example.test", "password", "ValidPassword1!"))), 409);
        assertTrue(response.path("message").asText().contains("Username"));
    }

    @Test
    void loginFailureDoesNotDiscloseWhetherTheAccountExists() throws Exception {
        User player = player();
        JsonNode unknown = safe(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", "missing_" + UUID.randomUUID(), "password", "WrongPassword1!"))), 401);
        JsonNode wrong = safe(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", player.getUsername(), "password", "WrongPassword1!"))), 401);
        assertEquals(unknown, wrong);
    }

    @Test
    void securityFailuresReturnJsonWith401Or403() throws Exception {
        safe(get("/api/users/me"), 401);
        safe(get("/api/users/me").header("Authorization", "Bearer PRIVATE_INVALID_TOKEN"), 401);
        safe(get("/api/users").with(user("reader").roles("PLAYER")), 403);
    }

    @Test
    void browserAcceptHeaderCannotExposeAnHtmlErrorPage() throws Exception {
        when(lessons.getLessonById(96L)).thenThrow(new IllegalStateException("PRIVATE_BROWSER_DETAIL"));
        safe(get("/api/lessons/96").with(user("reader")).accept(MediaType.TEXT_HTML), 500);
    }

    private JsonNode safe(MockHttpServletRequestBuilder request, int status) throws Exception {
        String content = mvc.perform(request).andExpect(status().is(status))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode body = json.readTree(content);
        assertEquals(1, body.size(), content);
        assertTrue(body.path("message").isTextual(), content);
        assertFalse(body.path("message").asText().isBlank());
        assertFalse(content.contains("PRIVATE_"), content);
        assertFalse(content.contains("jdbc:"), content);
        return body;
    }

    private User player() {
        String name = "error_" + UUID.randomUUID().toString().substring(0, 12);
        return users.save(User.builder().username(name).email(name + "@example.test")
                .password(passwords.encode("ValidPassword1!"))
                .role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
    }
}
