package com.giulia.dndacademy.security;

import org.springframework.beans.factory.annotation.Autowired;
import com.giulia.dndacademy.config.FrontendOrigin;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private com.giulia.dndacademy.security.ratelimit.AuthRateLimiter limiter;
    @Autowired
    private com.giulia.dndacademy.security.ratelimit.ClientAddressResolver addresses;
    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper json;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, UrlBasedCorsConfigurationSource corsConfigurationSource,
            ApiSecurityErrorHandler securityErrors) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors.authenticationEntryPoint(securityErrors).accessDeniedHandler(securityErrors))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/actuator/health/readiness").permitAll()
                        .requestMatchers("/actuator", "/actuator/**").denyAll()
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(new com.giulia.dndacademy.security.ratelimit.AuthRateLimitFilter(limiter, addresses, json), JwtFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource(FrontendOrigin frontendOrigin) {

        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(frontendOrigin.allowedOrigins());

        config.setAllowedMethods(
                List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS")
        );

        config.setAllowedHeaders(
                List.of("Authorization","Content-Type")
        );

        config.setAllowCredentials(false);
        config.setExposedHeaders(List.of("Retry-After"));
        config.setMaxAge(600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }
}
