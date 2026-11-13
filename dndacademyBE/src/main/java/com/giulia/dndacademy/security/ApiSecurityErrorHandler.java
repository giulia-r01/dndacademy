package com.giulia.dndacademy.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.dto.ErrorResponse;
import com.giulia.dndacademy.exceptions.ApiErrorMessages;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApiSecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {
    private final ObjectMapper json;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException ex) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, ApiErrorMessages.forStatus(HttpStatus.UNAUTHORIZED));
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex) throws IOException {
        write(response, HttpStatus.FORBIDDEN, ApiErrorMessages.forStatus(HttpStatus.FORBIDDEN));
    }

    public void sessionExpired(HttpServletResponse response) throws IOException {
        write(response, HttpStatus.UNAUTHORIZED, "Sessione scaduta. Accedi nuovamente.");
    }

    public void unavailable(HttpServletResponse response, Exception ex) throws IOException {
        log.error("Database non disponibile durante la verifica della sessione", ex);
        write(response, HttpStatus.SERVICE_UNAVAILABLE, ApiErrorMessages.forStatus(HttpStatus.SERVICE_UNAVAILABLE));
    }

    public void unexpected(HttpServletResponse response, Exception ex) throws IOException {
        log.error("Errore inatteso durante la verifica della sessione", ex);
        write(response, HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorMessages.forStatus(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    private void write(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        json.writeValue(response.getOutputStream(), ErrorResponse.builder().message(message).build());
    }
}
