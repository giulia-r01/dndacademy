package com.giulia.dndacademy.security;

import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.dto.ErrorResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtTool jwtTool;
    private final UserRepository users;
    private final ObjectMapper json;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = jwtTool.parse(header.substring(7));
                User user = users.findById(Long.valueOf(claims.getSubject()))
                        .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
                Number version = claims.get("version", Number.class);
                if (version == null || version.longValue() != user.getTokenVersion()) {
                    throw new IllegalArgumentException("Sessione scaduta");
                }
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
            } catch (JwtException | IllegalArgumentException ex) {
                SecurityContextHolder.clearContext();
                response.setStatus(401);
                response.setContentType("application/json");
                json.writeValue(response.getOutputStream(), ErrorResponse.builder()
                        .message("Sessione scaduta. Accedi nuovamente.").build());
                return;
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getServletPath().startsWith("/auth/");
    }
}
