package com.giulia.dndacademy.security.ratelimit;

import com.giulia.dndacademy.repository.AuthRateLimitBucketRepository;
import com.giulia.dndacademy.service.PasswordResetService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:limiter_http;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password="})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AuthRateLimitHttpTest {
    @Autowired MockMvc mvc;
    @Autowired AuthRateLimitBucketRepository buckets;
    @MockitoBean PasswordResetService reset;
    @BeforeEach void clean() { buckets.deleteAll(); clearInvocations(reset); }

    @Test void repeatedLoginIsBlockedEvenWhenIpChangesAndCorsPreservesRetryHeader() throws Exception {
        for (int i = 0; i < 20; i++) login("192.0.2." + (i + 1), "unknown").andExpect(status().isUnauthorized());
        login("192.0.2.99", "unknown").andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Expose-Headers", "Retry-After"))
                .andExpect(jsonPath("$.message").isString());
    }
    @Test void changingAccountsOrSpoofingHeadersCannotEvadeIpLimitAndOptionsAreFree() throws Exception {
        for (int i = 0; i < 60; i++) login("192.0.2.1", "unknown" + i).andExpect(status().isUnauthorized());
        login("192.0.2.1", "another").andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"));
        mvc.perform(options("/auth/login").servletPath("/auth/login").header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")).andExpect(status().isOk());
        login("192.0.2.2", "another").andExpect(status().isUnauthorized());
    }
    @Test void forgotPasswordCountsExistingAndUnknownIdentitiesBeforeSendingEmail() throws Exception {
        for (int i = 0; i < 3; i++) forgot("person@example.test").andExpect(status().isOk());
        forgot("PERSON@example.test").andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After"));
        verify(reset, times(3)).forgotPassword(any());
        forgot("other@example.test").andExpect(status().isOk());
    }
    @Test void malformedPayloadConsumesIpQuotaAndOtherPublicRoutesRemainReachable() throws Exception {
        for (int i = 0; i < 10; i++) mvc.perform(post("/auth/register").servletPath("/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content("{")).andExpect(status().isBadRequest());
        mvc.perform(post("/auth/register").servletPath("/auth/register").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isTooManyRequests());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
        mvc.perform(get("/auth/not-a-real-route")).andExpect(status().isNotFound()).andExpect(jsonPath("$.message").value("Risorsa non trovata."));
    }
    private org.springframework.test.web.servlet.ResultActions login(String address, String username) throws Exception {
        return mvc.perform(post("/auth/login").servletPath("/auth/login").with(request -> {request.setRemoteAddr(address); return request;})
                .header("X-Real-IP", java.util.UUID.randomUUID().toString()).header("X-Forwarded-For", java.util.UUID.randomUUID().toString())
                .header("Origin", "http://localhost:3000").contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + username + "\",\"password\":\"wrong\"}"));
    }
    private org.springframework.test.web.servlet.ResultActions forgot(String email) throws Exception {
        return mvc.perform(post("/auth/forgot-password").servletPath("/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"" + email + "\"}"));
    }
}
