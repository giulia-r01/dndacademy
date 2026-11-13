package com.giulia.dndacademy.security.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.dto.ErrorResponse;
import com.giulia.dndacademy.exceptions.ApiErrorMessages;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.util.Set;

@RequiredArgsConstructor @Slf4j
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final Set<String> PATHS = Set.of("/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password");
    private final AuthRateLimiter limiter;
    private final ClientAddressResolver addresses;
    private final ObjectMapper json;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !PATHS.contains(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            limiter.checkAddress(request.getServletPath().substring("/auth/".length()), addresses.resolve(request));
        } catch (ResponseStatusException ex) {
            ex.getHeaders().forEach((name, values) -> values.forEach(value -> response.addHeader(name, value)));
            write(response, ex.getStatusCode().value(), ex.getReason());
            return;
        } catch (RuntimeException ex) {
            log.error("Verifica del limite di autenticazione non disponibile", ex);
            write(response, 503, ApiErrorMessages.forStatus(HttpStatus.SERVICE_UNAVAILABLE));
            return;
        }
        chain.doFilter(request, response);
    }

    private void write(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Cache-Control", "no-store");
        json.writeValue(response.getOutputStream(), ErrorResponse.builder().message(message).build());
    }
}
