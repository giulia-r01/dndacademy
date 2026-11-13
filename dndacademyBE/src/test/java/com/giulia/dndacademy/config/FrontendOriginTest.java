package com.giulia.dndacademy.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FrontendOriginTest {
    @ParameterizedTest
    @ValueSource(strings = {"", "null", "*", "https://*.vercel.app", "https://academy.example/login",
            "https://academy.example?token=secret", "https://academy.example#fragment",
            "https://user:password@academy.example", "ftp://academy.example", "https://academy.example:70000"})
    void rejectsValuesThatAreNotSingleOrigins(String value) {
        assertThrows(IllegalArgumentException.class, () -> new FrontendOrigin(value, false, false));
    }

    @ParameterizedTest
    @ValueSource(strings = {"http://academy.example", "https://localhost", "https://LOCALHOST.",
            "https://test.localhost", "https://127.0.0.1", "https://0.0.0.0", "https://[::1]",
            "https://[::0001]", "https://[::]"})
    void productionRejectsHttpAndLoopbackOrigins(String value) {
        assertThrows(IllegalArgumentException.class, () -> new FrontendOrigin(value, false, true));
    }

    @Test
    void normalizesConfiguredOriginAndAddsOnlyNextLocalOriginsWithoutDuplicates() {
        var origin = new FrontendOrigin(" HTTP://LOCALHOST:3000/ ", true, false);
        assertEquals("http://localhost:3000", origin.baseUrl());
        assertEquals(List.of("http://localhost:3000", "http://127.0.0.1:3000"), origin.allowedOrigins());
    }

    @Test
    void productionAllowsOnlyTheExactConfiguredHttpsOrigin() {
        var origin = new FrontendOrigin("HTTPS://ACADEMY.VERCEL.APP:443/", false, true);
        assertEquals("https://academy.vercel.app", origin.baseUrl());
        assertEquals(List.of("https://academy.vercel.app"), origin.allowedOrigins());
    }

    @Test
    void productionCannotEnableDevelopmentOriginExceptions() {
        assertThrows(IllegalArgumentException.class,
                () -> new FrontendOrigin("https://academy.example", true, true));
    }

    @Test
    void springConfigurationValidatesTheActiveProductionProfileAtStartup() {
        var runner = new ApplicationContextRunner().withUserConfiguration(FrontendConfiguration.class)
                .withPropertyValues("spring.profiles.active=prod", "app.cors.allow-local-origins=false");
        runner.withPropertyValues("app.frontend-base-url=https://academy.example").run(context -> {
            assertNull(context.getStartupFailure());
            assertEquals(List.of("https://academy.example"), context.getBean(FrontendOrigin.class).allowedOrigins());
        });
        runner.withPropertyValues("app.frontend-base-url=http://localhost:3000").run(context ->
                assertNotNull(context.getStartupFailure()));
        runner.withPropertyValues("app.frontend-base-url=https://academy.example", "app.cors.allow-local-origins=true")
                .run(context -> assertNotNull(context.getStartupFailure()));
    }
}
