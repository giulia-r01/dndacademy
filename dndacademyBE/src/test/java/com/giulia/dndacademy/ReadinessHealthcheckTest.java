package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthContributor;
import org.springframework.boot.actuate.health.HealthContributorRegistry;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:readiness_healthcheck;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReadinessHealthcheckTest {
    private static final String PATH = "/actuator/health/readiness";
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired HealthContributorRegistry contributors;
    @Autowired ConfigurableApplicationContext context;

    @Test
    void anonymousReadinessChecksTheDatabaseAndReturnsOnlyStatus() throws Exception {
        assertNotNull(contributors.getContributor("db"));
        assertStatusOnly(probe(), 200, "UP");
    }

    @Test
    void publicProbeIgnoresBearerButOtherEndpointsStillValidateIt() throws Exception {
        assertStatusOnly(probe().header("Authorization", "Bearer invalid-token"), 200, "UP");
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void failedDatabasePreventsReadinessWithoutExposingConnectionDetails() throws Exception {
        HealthContributor database = contributors.unregisterContributor("db");
        assertNotNull(database);
        try {
            contributors.registerContributor("db", (HealthIndicator) () -> Health
                    .down(new SQLException("private connection and credentials"))
                    .withDetail("database", "private database name").build());
            assertStatusOnly(probe(), 503, "DOWN");
        } finally {
            contributors.unregisterContributor("db");
            contributors.registerContributor("db", database);
        }
        assertStatusOnly(probe(), 200, "UP");
    }

    @Test
    void applicationRefusingTrafficIsNotReadyEvenWithHealthyDatabase() throws Exception {
        AvailabilityChangeEvent.publish(context, ReadinessState.REFUSING_TRAFFIC);
        try {
            assertStatusOnly(probe(), 503, "OUT_OF_SERVICE");
        } finally {
            AvailabilityChangeEvent.publish(context, ReadinessState.ACCEPTING_TRAFFIC);
        }
    }

    @Test
    @WithMockUser(roles = "MASTER")
    void otherManagementPathsAreDeniedEvenToMasterAccounts() throws Exception {
        assertStatusOnly(probe(), 200, "UP");
        for (String path : new String[] {"/actuator", "/actuator/health", "/actuator/health/liveness",
                PATH + "/db", "/actuator/env", "/actuator/configprops", "/actuator/beans", "/actuator/metrics"}) {
            mvc.perform(get(path).servletPath(path)).andExpect(status().isForbidden());
        }
    }

    @Test
    void nonGetProbesAndAnonymousApplicationRequestsRemainProtected() throws Exception {
        mvc.perform(post(PATH).servletPath(PATH)).andExpect(status().is4xxClientError());
        mvc.perform(put(PATH).servletPath(PATH)).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/users/me")).andExpect(status().is4xxClientError());
    }

    private MockHttpServletRequestBuilder probe() {
        return get(PATH).servletPath(PATH);
    }

    private void assertStatusOnly(MockHttpServletRequestBuilder request, int status, String expected) throws Exception {
        String response = mvc.perform(request).andExpect(status().is(status))
                .andExpect(header().doesNotExist("WWW-Authenticate"))
                .andReturn().getResponse().getContentAsString();
        JsonNode body = json.readTree(response);
        assertEquals(1, body.size(), response);
        assertEquals(expected, body.path("status").asText());
    }
}
