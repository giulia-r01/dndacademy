package com.giulia.dndacademy.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;

@Configuration
public class FrontendConfiguration {
    @Bean
    public FrontendOrigin frontendOrigin(
            @Value("${app.frontend-base-url}") String frontendBaseUrl,
            @Value("${app.cors.allow-local-origins:false}") boolean allowLocalOrigins,
            Environment environment) {
        return new FrontendOrigin(frontendBaseUrl, allowLocalOrigins,
                environment.acceptsProfiles(Profiles.of("prod")));
    }
}
