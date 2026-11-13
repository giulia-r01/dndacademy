package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.security.JwtTool;
import com.giulia.dndacademy.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=${ACCOUNT_DELETION_TEST_DB_URL:jdbc:h2:mem:account_deletion;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE}",
    "spring.datasource.username=${ACCOUNT_DELETION_TEST_DB_USER:sa}", "spring.datasource.password=${ACCOUNT_DELETION_TEST_DB_PASSWORD:}",
    "spring.flyway.enabled=true", "spring.flyway.default-schema=public", "spring.jpa.hibernate.ddl-auto=validate",
    "app.avatar-cleanup.enabled=false"
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class AccountDeletionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwords;
    @Autowired JwtTool jwt;
    @Autowired JdbcTemplate jdbc;
    @Autowired AvatarCleanupRepository cleanup;
    @Autowired AvatarCleanupStore store;
    @MockitoBean ImageUploadService images;
    static final AtomicLong sequence = new AtomicLong(10000);
    User account;
    String token;
    final String password = "Original1!";

    @BeforeEach void setup() {
        cleanup.deleteAll();
        account = newUser(Role.PLAYER);
        token = jwt.generateToken(account);
    }

    User newUser(Role role) {
        String suffix = UUID.randomUUID().toString().replace("-", "");
        return users.saveAndFlush(User.builder().username("u" + suffix).email(suffix + "@example.test")
                .password(passwords.encode(password)).role(role).learningLevel(LearningLevel.BEGINNER).build());
    }

    Map<String, Object> request() { return new HashMap<>(Map.of("currentPassword", password, "confirmed", true)); }

    org.springframework.test.web.servlet.ResultActions deleteAccount(Map<String, Object> data) throws Exception {
        return mvc.perform(delete("/api/users/me").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data)));
    }

    long count(String table, String column, long id) {
        return jdbc.queryForObject("select count(*) from " + table + " where " + column + " = ?", Long.class, id);
    }

    long campaign(User master) {
        long id = sequence.incrementAndGet();
        jdbc.update("insert into campaigns (id,name,difficulty,master_id) values (?,'Campagna','BEGINNER',?)", id, master.getId());
        return id;
    }

    long npc(User owner) {
        long id = sequence.incrementAndGet();
        jdbc.update("insert into npcs (id,name,max_hp,armor_class,dexterity,attack_modifier,damage_die,damage_modifier,enemy,healer,healing_die,healing_modifier,healing_uses,owner_id) values (?,'Custode',10,12,12,2,6,0,true,false,0,0,0,?)", id, owner.getId());
        return id;
    }

    long character(long campaign, Long player, Long template) {
        long id = sequence.incrementAndGet();
        jdbc.update("insert into characters (id,name,level,max_hp,current_hp,armor_class,damage_die,spell_damage_die,spellcaster,alive,campaign_id,player_id,source_template_id) values (?,'Eroe',1,10,10,12,6,0,false,true,?,?,?)", id, campaign, player, template);
        jdbc.update("insert into character_stats (character_id,strength,dexterity,constitution,intelligence,wisdom,charisma) values (?,10,10,10,10,10,10)", id);
        return id;
    }

    @Test void deletionIsAuthenticatedAndCannotTargetAnotherUser() throws Exception {
        User other = newUser(Role.PLAYER);
        mvc.perform(delete("/api/users/me").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request())))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/users/" + other.getId()).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(request()))).andExpect(status().isMethodNotAllowed());
        var data = request(); data.put("id", other.getId()); data.put("userId", other.getId());
        deleteAccount(data).andExpect(status().isNoContent());
        assertFalse(users.existsById(account.getId())); assertTrue(users.existsById(other.getId()));
    }

    @Test void passwordAndExplicitConfirmationAreRequired() throws Exception {
        var wrong = request(); wrong.put("currentPassword", "wrong");
        deleteAccount(wrong).andExpect(status().isBadRequest());
        var unconfirmed = request(); unconfirmed.put("confirmed", false);
        deleteAccount(unconfirmed).andExpect(status().isBadRequest());
        var missing = request(); missing.remove("confirmed");
        deleteAccount(missing).andExpect(status().isBadRequest());
        var blank = request(); blank.put("currentPassword", "");
        deleteAccount(blank).andExpect(status().isBadRequest());
        assertTrue(users.existsById(account.getId())); assertEquals(0, cleanup.count());
    }

    @Test void removesPersonalDataAndRevokesSessionsWithoutRemovingSharedContent() throws Exception {
        User master = newUser(Role.MASTER), other = newUser(Role.PLAYER);
        long campaign = campaign(master), template = character(campaign, null, null);
        long personal = character(campaign, account.getId(), template), otherCharacter = character(campaign, other.getId(), template);
        long chapter = sequence.incrementAndGet(), encounter = sequence.incrementAndGet(), combat = sequence.incrementAndGet();
        jdbc.update("insert into campaign_chapters (id,campaign_id,title,story_text,order_index,has_combat) values (?,?,'Capitolo','Storia',1,true)", chapter, campaign);
        jdbc.update("insert into encounters (id,title,chapter_id) values (?,'Incontro',?)", encounter, chapter);
        jdbc.update("insert into combat (id,campaign_id,chapter_id,encounter_id,user_id,completed,current_turn_index) values (?,?,?,?,?,false,0)", combat, campaign, chapter, encounter, account.getId());
        jdbc.update("insert into combat_participants (combat_id,character_id,current_hp,max_hp,initiative,alive,enemy,healing_used) values (?,?,10,10,1,true,false,0)", combat, personal);
        jdbc.update("insert into combat_turn_order (combat_id,turn_order) values (?,?)", combat, personal);
        jdbc.update("insert into combat_events (combat_id,event_index,action_type,healing,healing_die,healing_roll) values (?,0,'ATTACK',0,0,0)", combat);
        jdbc.update("insert into campaign_players (campaign_id,user_id) values (?,?),(?,?)", campaign, account.getId(), campaign, other.getId());
        jdbc.update("insert into campaign_progress (campaign_id,user_id,completed,unlocked) values (?,?,false,true)", campaign, account.getId());
        jdbc.update("insert into campaign_chapter_progress (chapter_id,user_id,completed,unlocked) values (?,?,false,true)", chapter, account.getId());
        jdbc.update("insert into password_reset_tokens (user_id,token,expiration_date,used) values (?, ?,CURRENT_TIMESTAMP,false)", account.getId(), UUID.randomUUID().toString());
        jdbc.update("insert into email_outbox (id,user_id,recipient,kind,status,created_at,expires_at,next_attempt_at,updated_at,attempts) values (?,?,'fake@example.test','WELCOME','PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,0)", UUID.randomUUID().toString(), account.getId());
        long lesson = sequence.incrementAndGet(), quiz = sequence.incrementAndGet();
        jdbc.update("insert into lessons (id,title,content,order_index,unlocked_by_default) values (?,'Lezione','Testo',1,true)", lesson);
        jdbc.update("insert into quizzes (id,title,passing_score,lesson_id) values (?,'Quiz',1,?)", quiz, lesson);
        jdbc.update("insert into user_lesson_progress (user_id,lesson_id,completed,unlocked) values (?,?,true,true)", account.getId(), lesson);
        jdbc.update("insert into user_quiz_results (user_id,quiz_id,score,passed,correct_answers,total_questions) values (?,?,1,true,1,1)", account.getId(), quiz);
        long badge = jdbc.queryForObject("select min(id) from badges", Long.class);
        jdbc.update("insert into user_badges (user_id,badge_id) values (?,?)", account.getId(), badge);
        String otherSession = jwt.generateToken(account);
        deleteAccount(request()).andExpect(status().isNoContent());
        assertFalse(users.existsById(account.getId())); assertTrue(users.existsById(other.getId()));
        for (String table : List.of("campaign_players", "campaign_progress", "campaign_chapter_progress", "password_reset_tokens", "email_outbox", "user_lesson_progress", "user_quiz_results", "user_badges", "combat")) assertEquals(0, count(table,"user_id", account.getId()), table);
        for (String table : List.of("combat_participants", "combat_turn_order", "combat_events")) assertEquals(0, count(table,"combat_id", combat), table);
        assertEquals(0, count("characters","id",personal)); assertEquals(0, count("character_stats","character_id",personal));
        assertEquals(1, count("characters","id",template)); assertEquals(1, count("characters","id",otherCharacter));
        assertEquals(1, count("campaign_players","user_id",other.getId())); assertEquals(1, count("campaigns","id",campaign));
        assertEquals(1, cleanup.count()); verifyNoInteractions(images);
        for (String session : List.of(token, otherSession)) mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + session)).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("username",account.getUsername(),"password",password)))).andExpect(status().isUnauthorized());
    }

    @Test void masterTransfersContentsOnlyToAnotherCurrentMaster() throws Exception {
        account.setRole(Role.MASTER); users.saveAndFlush(account);
        long campaign = campaign(account), npc = npc(account);
        User successor = newUser(Role.MASTER), player = newUser(Role.PLAYER);
        mvc.perform(get("/api/users/me/deletion-plan").header("Authorization", "Bearer " + token)).andExpect(status().isOk())
                .andExpect(jsonPath("$.campaigns").value(1)).andExpect(jsonPath("$.npcs").value(1))
                .andExpect(jsonPath("$.successors[0].email").doesNotExist());
        deleteAccount(request()).andExpect(status().isConflict());
        for (Long invalid : List.of(account.getId(), player.getId(), Long.MAX_VALUE)) {
            var data = request(); data.put("successorMasterId",invalid); deleteAccount(data).andExpect(status().isConflict());
        }
        var data = request(); data.put("successorMasterId",successor.getId());
        deleteAccount(data).andExpect(status().isNoContent());
        assertEquals(successor.getId(), jdbc.queryForObject("select master_id from campaigns where id=?", Long.class,campaign));
        assertEquals(successor.getId(), jdbc.queryForObject("select owner_id from npcs where id=?", Long.class,npc));
    }

    @Test void databaseFailureRollsBackTransferCleanupAndDeletion() throws Exception {
        account.setRole(Role.MASTER); users.saveAndFlush(account);
        long campaign = campaign(account);
        User successor = newUser(Role.MASTER);
        jdbc.execute("create table deletion_test_guard (user_id bigint references users(id))");
        try {
            jdbc.update("insert into deletion_test_guard (user_id) values (?)",account.getId());
            var data=request(); data.put("successorMasterId",successor.getId());
            deleteAccount(data).andExpect(status().is5xxServerError());
            assertTrue(users.existsById(account.getId())); assertEquals(0,cleanup.count());
            assertEquals(account.getId(),jdbc.queryForObject("select master_id from campaigns where id=?",Long.class,campaign));
        } finally { jdbc.execute("drop table deletion_test_guard"); }
    }

    @Test void avatarCleanupRetriesAndFencesOldLeases() throws Exception {
        deleteAccount(request()).andExpect(status().isNoContent());
        Instant now=Instant.now();
        var first=store.claim(now); assertNotNull(first);
        assertNull(store.claim(now.plusSeconds(1)));
        var recovered=store.claim(now.plusSeconds(121)); assertNotNull(recovered);
        store.finish(first,true,now); assertEquals(1,cleanup.count());
        store.finish(recovered,false,now); assertEquals(1,cleanup.count());
        assertNull(store.claim(now.plusSeconds(1)));
        var worker=new AvatarCleanupWorker(store,images);
        doThrow(new IllegalStateException("errore simulato")).when(images).deleteUserImage(account.getId());
        assertTrue(worker.runOne(now.plusSeconds(3600))); assertEquals(1,cleanup.count());
        doNothing().when(images).deleteUserImage(account.getId());
        assertTrue(worker.runOne(now.plusSeconds(7200))); assertEquals(0,cleanup.count());
        assertFalse(worker.runOne(now.plusSeconds(7200)));
    }
}
