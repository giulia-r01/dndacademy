package com.giulia.dndacademy.security;

import com.giulia.dndacademy.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.Date;

@Component
public class JwtTool {
    @Value("${JWT_SECRET}") private String secret;
    @Value("${JWT_EXPIRATION}") private long expiration;

    public String generateToken(User user) {
        return Jwts.builder().setSubject(user.getId().toString())
                .claim("version", user.getTokenVersion())
                .setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8))).compact();
    }

    public Claims parse(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .build().parseClaimsJws(token).getBody();
    }
}
