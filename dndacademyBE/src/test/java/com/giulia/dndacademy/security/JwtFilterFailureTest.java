package com.giulia.dndacademy.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtFilterFailureTest {
    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    static Stream<Arguments> failures() {
        return Stream.of(Arguments.of(new DataAccessResourceFailureException("PRIVATE_JDBC_CONNECTION"), 503),
                Arguments.of(new IllegalStateException("PRIVATE_INTERNAL_DETAIL"), 500));
    }

    @ParameterizedTest
    @MethodSource("failures")
    void errorsBeforeTheControllerUseSafeJsonAndDoNotBecomeAuthenticationFailures(RuntimeException failure, int status) throws Exception {
        JwtTool jwt = mock(JwtTool.class);
        UserRepository users = mock(UserRepository.class);
        ObjectMapper json = new ObjectMapper();
        when(jwt.parse("token")).thenReturn(Jwts.claims(Map.of("version", 0)).setSubject("1"));
        when(users.findById(1L)).thenThrow(failure);
        JwtFilter filter = new JwtFilter(jwt, users, new ApiSecurityErrorHandler(json));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/me");
        request.setServletPath("/api/users/me");
        request.addHeader("Authorization", "Bearer token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        assertEquals(status, response.getStatus());
        assertEquals(1, json.readTree(response.getContentAsByteArray()).size());
        assertFalse(response.getContentAsString().contains("PRIVATE_"));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertNull(chain.getRequest());
    }
}
