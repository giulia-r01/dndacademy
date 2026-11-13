package com.giulia.dndacademy;

import jakarta.persistence.Entity;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class InitialSchemaMigrationTest {
    @TempDir Path temporaryMigrations;

    private String newDatabase() {
        return "jdbc:h2:mem:migration_" + UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE";
    }

    private Flyway flyway(String url) {
        return Flyway.configure().dataSource(url, "sa", "")
                .defaultSchema("public").locations("classpath:db/migration")
                .baselineOnMigrate(false).cleanDisabled(true).load();
    }

    @Test
    void upgradesExistingV1WithoutLosingApplicationData() throws Exception {
        String url = newDatabase();
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            var original = Flyway.configure().dataSource(url, "sa", "").defaultSchema("public")
                    .locations("classpath:db/migration").target("1").cleanDisabled(true).load();
            assertEquals(1, original.migrate().migrationsExecuted);
            statement.executeUpdate("insert into users (username,email,password,token_version,role) "
                    + "values ('before_v2','before_v2@example.test','hash',0,'PLAYER')");
            assertEquals(2, flyway(url).migrate().migrationsExecuted);
            validateAllEntityMappings(url);
            try (var rows = statement.executeQuery("select username from users")) {
                assertTrue(rows.next());
                assertEquals("before_v2", rows.getString(1));
            }
            try (var rows = statement.executeQuery("select count(*) from auth_rate_limit_buckets")) {
                assertTrue(rows.next());
                assertEquals(0, rows.getInt(1));
            }
        }
    }

    @Test
    void upgradesExistingV2AndRetainsUsersAndRateLimitCounters() throws Exception {
        String url = newDatabase();
        try (Connection connection = DriverManager.getConnection(url, "sa", ""); var statement = connection.createStatement()) {
            var previous = Flyway.configure().dataSource(url, "sa", "").defaultSchema("public")
                    .locations("classpath:db/migration").target("2").cleanDisabled(true).load();
            assertEquals(2, previous.migrate().migrationsExecuted);
            statement.execute("insert into users (username,email,password,token_version,role) values ('before_v3','before_v3@example.test','hash',0,'PLAYER')");
            statement.execute("insert into auth_rate_limit_buckets (id,attempts,expires_at) values ('" + "a".repeat(64) + "', 3, CURRENT_TIMESTAMP)");
            assertEquals(1, flyway(url).migrate().migrationsExecuted);
            validateAllEntityMappings(url);
            try (var rows = statement.executeQuery("select attempts from auth_rate_limit_buckets")) { assertTrue(rows.next()); assertEquals(3, rows.getInt(1)); }
            try (var rows = statement.executeQuery("select username from users")) { assertTrue(rows.next()); assertEquals("before_v3", rows.getString(1)); }
            try (var rows = statement.executeQuery("select count(*) from email_outbox")) { assertTrue(rows.next()); assertEquals(0, rows.getInt(1)); }
        }
    }

    @Test
    void freshInstallMatchesAllEntitiesAndSecondStartupKeepsData() throws Exception {
        String url = newDatabase();
        try (Connection connection = DriverManager.getConnection(url, "sa", "")) {
            assertEquals(3, flyway(url).migrate().migrationsExecuted);
            validateAllEntityMappings(url);
            try (var statement = connection.createStatement()) {
                statement.executeUpdate("insert into users (username,email,password,token_version,role,learning_level) "
                        + "values ('retained','retained@example.test','test-hash',0,'PLAYER','BEGINNER')");
                statement.executeUpdate("insert into lessons (title,content,order_index,unlocked_by_default) "
                        + "values ('Retained lesson','Teaching content',1,true)");
            }
            Flyway restarted = flyway(url);
            assertEquals(0, restarted.migrate().migrationsExecuted);
            assertEquals("3", restarted.info().current().getVersion().getVersion());
            try (var statement = connection.createStatement();
                 var rows = statement.executeQuery("select username from users")) {
                assertTrue(rows.next());
                assertEquals("retained", rows.getString(1));
                assertFalse(rows.next());
            }
            try (var statement = connection.createStatement();
                 var rows = statement.executeQuery("select content from lessons")) {
                assertTrue(rows.next());
                assertEquals("Teaching content", rows.getString(1));
            }
        }
    }

    @Test
    void refusesUnmanagedPopulatedSchemaWithoutDeletingOrBaseliningIt() throws Exception {
        String url = newDatabase();
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            statement.execute("create table legacy_marker (id integer primary key)");
            statement.execute("insert into legacy_marker values (42)");
            assertThrows(FlywayException.class, () -> flyway(url).migrate());
            try (var rows = statement.executeQuery("select id from legacy_marker")) {
                assertTrue(rows.next());
                assertEquals(42, rows.getInt(1));
            }
        }
    }

    @Test
    void schemaProtectsPersonalCopiesAndDisablesClean() throws Exception {
        String url = newDatabase();
        try (Connection connection = DriverManager.getConnection(url, "sa", "");
             var statement = connection.createStatement()) {
            Flyway flyway = flyway(url);
            flyway.migrate();
            statement.execute("insert into users (id,username,email,password,token_version,role) values "
                    + "(1,'one','one@example.test','hash',0,'PLAYER'),"
                    + "(2,'two','two@example.test','hash',0,'PLAYER')");
            statement.execute("insert into campaigns (id,name,difficulty) values (1,'Teaching campaign','BEGINNER')");
            insertCharacter(connection, 10, null, null);
            insertCharacter(connection, 11, 1L, 10L);
            insertCharacter(connection, 12, 2L, 10L);
            assertConstraint(() -> insertCharacter(connection, 13, 1L, 10L));
            assertConstraint(() -> insertCharacter(connection, 14, 1L, null));
            assertConstraint(() -> insertCharacter(connection, 15, null, 10L));
            assertConstraint(() -> insertCharacter(connection, 16, 1L, 999L));
            assertConstraint(() -> statement.execute("delete from characters where id=10"));
            assertThrows(FlywayException.class, flyway::clean);
            try (var rows = statement.executeQuery("select count(*) from characters")) {
                assertTrue(rows.next());
                assertEquals(3, rows.getInt(1));
            }
        }
    }

    @Test
    void changingAnAppliedMigrationIsRejected() throws Exception {
        String url = newDatabase();
        try (Connection ignored = DriverManager.getConnection(url, "sa", "")) {
            var migration = temporaryMigrations.resolve("V1__initial_schema.sql");
            try (var stream = getClass().getResourceAsStream("/db/migration/V1__initial_schema.sql")) {
                assertNotNull(stream);
                Files.copy(stream, migration);
            }
            Flyway flyway = Flyway.configure().dataSource(url, "sa", "")
                    .defaultSchema("public").locations("filesystem:" + temporaryMigrations)
                    .baselineOnMigrate(false).cleanDisabled(true).load();
            flyway.migrate();
            Files.writeString(migration, "\ncreate table unintended_change (id bigint);\n",
                    StandardCharsets.UTF_8, java.nio.file.StandardOpenOption.APPEND);
            assertThrows(FlywayException.class, flyway::validate);
        }
    }

    private void insertCharacter(Connection connection, long id, Long player, Long template) throws SQLException {
        try (var statement = connection.prepareStatement("insert into characters "
                + "(id,name,level,alive,armor_class,current_hp,max_hp,damage_die,spell_damage_die,spellcaster,campaign_id,player_id,source_template_id) "
                + "values (?, 'Hero', 1, true, 15, 10, 10, 6, 0, false, 1, ?, ?)")) {
            statement.setLong(1, id);
            statement.setObject(2, player);
            statement.setObject(3, template);
            statement.executeUpdate();
        }
    }

    private void assertConstraint(SqlOperation operation) {
        SQLException failure = assertThrows(SQLException.class, operation::run);
        assertTrue(failure.getSQLState().startsWith("23"), failure.getSQLState());
    }

    @FunctionalInterface private interface SqlOperation { void run() throws SQLException; }

    private void validateAllEntityMappings(String url) throws Exception {
        var registry = new StandardServiceRegistryBuilder().applySettings(Map.of(
                "hibernate.connection.url", url,
                "hibernate.connection.username", "sa",
                "hibernate.connection.password", "",
                "hibernate.hbm2ddl.auto", "validate")).build();
        try {
            var sources = new MetadataSources(registry);
            var scanner = new ClassPathScanningCandidateComponentProvider(false);
            scanner.addIncludeFilter(new AnnotationTypeFilter(Entity.class));
            for (var definition : scanner.findCandidateComponents("com.giulia.dndacademy.model")) {
                sources.addAnnotatedClass(Class.forName(definition.getBeanClassName()));
            }
            var metadata = sources.getMetadataBuilder()
                    .applyImplicitNamingStrategy(new SpringImplicitNamingStrategy())
                    .applyPhysicalNamingStrategy(new CamelCaseToUnderscoresNamingStrategy()).build();
            try (var factory = metadata.buildSessionFactory()) {
                assertFalse(factory.isClosed());
            }
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
