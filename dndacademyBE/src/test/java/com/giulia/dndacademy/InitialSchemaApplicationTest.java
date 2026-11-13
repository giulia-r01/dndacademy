package com.giulia.dndacademy;

import com.giulia.dndacademy.model.enumerations.SystemBadge;
import com.giulia.dndacademy.repository.BadgeRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:initial_schema_boot;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.flyway.enabled=true", "spring.flyway.default-schema=public",
        "spring.flyway.baseline-on-migrate=false", "spring.flyway.clean-disabled=true",
        "spring.jpa.hibernate.ddl-auto=validate"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class InitialSchemaApplicationTest {
    @Autowired Flyway flyway;
    @Autowired BadgeRepository badges;
    @Autowired Environment environment;

    @Test
    void applicationStartsWithMigratedSchemaAndInitializesSystemBadges() {
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("4", flyway.info().current().getVersion().getVersion());
        for (SystemBadge badge : SystemBadge.values()) {
            assertTrue(badges.findBySystemCode(badge).isPresent());
        }
        assertEquals(0, flyway.migrate().migrationsExecuted);
    }
}
