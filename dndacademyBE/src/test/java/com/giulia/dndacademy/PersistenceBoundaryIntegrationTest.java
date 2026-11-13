package com.giulia.dndacademy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.giulia.dndacademy.dto.CreateAnswerRequest;
import com.giulia.dndacademy.dto.CreateQuestionRequest;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.Character;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.AnswerRepository;
import com.giulia.dndacademy.repository.QuestionRepository;
import com.giulia.dndacademy.security.JwtTool;
import com.giulia.dndacademy.service.QuestionService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewFilter;
import org.springframework.orm.jpa.support.OpenEntityManagerInViewInterceptor;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:persistence_boundaries;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa", "spring.datasource.password="
})
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class PersistenceBoundaryIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired EntityManager entities;
    @Autowired PlatformTransactionManager transactions;
    @Autowired JwtTool tokens;
    @Autowired Environment environment;
    @Autowired ApplicationContext context;
    @Autowired QuestionService questionService;
    @Autowired QuestionRepository questions;
    @Autowired AnswerRepository answers;
    Fixture fixture;

    record Fixture(long campaign, long chapter, long lesson, long quiz, long question,
                   long correctAnswer, long template, long encounter, String masterToken,
                   String playerToken, String outsiderToken, String playerName, String campaignName) {}

    @BeforeEach
    void createCommittedFixtures() {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        fixture = new TransactionTemplate(transactions).execute(ignored -> {
            String key = UUID.randomUUID().toString().substring(0, 12);
            User master = account("master_" + key, Role.MASTER);
            User player = account("player_" + key, Role.PLAYER);
            User outsider = account("outside_" + key, Role.PLAYER);
            Campaign campaign = Campaign.builder().name("Campaign " + key).description("Story")
                    .difficulty(CampaignDifficulty.BEGINNER).master(master).build();
            campaign.getPlayers().add(player);
            entities.persist(campaign);
            Lesson lesson = Lesson.builder().title("Lesson " + key).content("Learn to roll a d20")
                    .orderIndex(1).unlockedByDefault(true).build();
            entities.persist(lesson);
            Quiz quiz = Quiz.builder().title("Quiz " + key).lesson(lesson).passingScore(100).build();
            entities.persist(quiz);
            Question question = Question.builder().quiz(quiz).text("Which die?").build();
            entities.persist(question);
            Answer correct = Answer.builder().question(question).text("d20").correct(true).build();
            entities.persist(correct);
            entities.persist(Answer.builder().question(question).text("d6").correct(false).build());
            Badge reward = Badge.builder().name("Reward " + key).description("Reward").build();
            entities.persist(reward);
            CampaignChapter chapter = CampaignChapter.builder().campaign(campaign).title("Chapter")
                    .storyText("Story before the lesson").orderIndex(1).hasCombat(true)
                    .lesson(lesson).quiz(quiz).rewardBadge(reward).build();
            entities.persist(chapter);
            Character model = Character.builder().campaign(campaign).name("Mira " + key).level(1)
                    .maxHp(12).currentHp(12).armorClass(15).weaponName("Mace").damageDie(6)
                    .attackAbility(AttackAbility.STRENGTH).build();
            entities.persist(model);
            CharacterStats stats = CharacterStats.builder().character(model).strength(14).dexterity(12)
                    .constitution(12).intelligence(10).wisdom(14).charisma(10).build();
            entities.persist(stats);
            model.setStats(stats);
            Npc enemy = Npc.builder().owner(master).name("Goblin " + key).maxHp(5).armorClass(10)
                    .dexterity(10).attackModifier(0).damageDie(4).enemy(true).build();
            entities.persist(enemy);
            Encounter encounter = Encounter.builder().chapter(chapter).title("Training encounter").build();
            entities.persist(encounter);
            entities.persist(EncounterNpc.builder().encounter(encounter).npc(enemy).quantity(1).build());
            entities.flush();
            return new Fixture(campaign.getId(), chapter.getId(), lesson.getId(), quiz.getId(), question.getId(),
                    correct.getId(), model.getId(), encounter.getId(), tokens.generateToken(master),
                    tokens.generateToken(player), tokens.generateToken(outsider), player.getUsername(), campaign.getName());
        });
    }

    @Test
    void masterAndPlayerReadRelatedContentWithoutOpenSessionInView() throws Exception {
        assertEquals("false", environment.getProperty("spring.jpa.open-in-view"));
        assertTrue(context.getBeansOfType(OpenEntityManagerInViewInterceptor.class).isEmpty());
        assertTrue(context.getBeansOfType(OpenEntityManagerInViewFilter.class).isEmpty());
        JsonNode chapter = request(get("/api/campaigns/" + fixture.campaign() + "/chapters"), fixture.playerToken()).get(0);
        assertEquals(fixture.campaignName(), chapter.path("campaignName").asText());
        assertTrue(chapter.path("lessonTitle").asText().startsWith("Lesson "));
        assertTrue(chapter.path("quizTitle").asText().startsWith("Quiz "));
        assertTrue(chapter.path("rewardBadgeName").asText().startsWith("Reward "));
        assertEquals(fixture.playerName(), request(get("/api/campaigns/" + fixture.campaign() + "/players"), fixture.playerToken()).get(0).asText());
        JsonNode copy = request(patch("/api/characters/" + fixture.template() + "/claim"), fixture.playerToken());
        assertNotEquals(fixture.template(), copy.path("id").asLong());
        assertEquals(14, copy.path("stats").path("strength").asInt());
        assertEquals(fixture.playerName(), request(get("/api/campaigns/" + fixture.campaign() + "/party"), fixture.masterToken()).get(0).path("playerUsername").asText());
        assertEquals(1, request(get("/api/characters/campaign/" + fixture.campaign() + "/admin"), fixture.masterToken()).get(0).path("assignedCount").asInt());
        JsonNode encounter = request(get("/api/encounters/" + fixture.encounter()), fixture.masterToken());
        assertEquals(fixture.chapter(), encounter.path("chapterId").asLong());
        assertEquals(1, encounter.path("npcs").size());
        assertEquals(fixture.quiz(), request(get("/api/lessons/" + fixture.lesson()), fixture.playerToken()).path("quiz").path("id").asLong());
        assertEquals(fixture.quiz(), request(get("/api/quizzes/" + fixture.quiz()), fixture.masterToken()).path("id").asLong());
        request(get("/api/campaigns"), fixture.playerToken());
        request(get("/api/npcs"), fixture.masterToken());
        mvc.perform(get("/api/campaigns/" + fixture.campaign() + "/chapters")
                        .header("Authorization", "Bearer " + fixture.outsiderToken()))
                .andExpect(status().is4xxClientError());
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
    }

    @Test
    void learningAndCombatPersistAcrossIndependentRequests() throws Exception {
        request(get("/api/campaigns/" + fixture.campaign() + "/chapters/player"), fixture.playerToken());
        request(patch("/api/characters/" + fixture.template() + "/claim"), fixture.playerToken());
        request(get("/api/lessons/me/progress"), fixture.playerToken());
        JsonNode completed = request(patch("/api/lessons/" + fixture.lesson() + "/complete"), fixture.playerToken());
        assertTrue(completed.path("completed").asBoolean());
        request(get("/api/quizzes/lesson/" + fixture.lesson()), fixture.playerToken());
        request(get("/api/questions/quiz/" + fixture.quiz()), fixture.playerToken());
        JsonNode result = request(post("/api/quizzes/submit").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("quizId", fixture.quiz(), "answers", List.of(
                        Map.of("questionId", fixture.question(), "answerId", fixture.correctAnswer()))))), fixture.playerToken());
        assertTrue(result.path("passed").asBoolean());
        assertEquals(100, request(get("/api/quizzes/me/results"), fixture.playerToken()).get(0).path("score").asInt());
        assertFalse(request(get("/api/badges/me"), fixture.playerToken()).isEmpty());
        request(get("/api/badges/catalog"), fixture.playerToken());
        request(get("/api/combat/chapter/" + fixture.chapter() + "/preview"), fixture.playerToken());
        long combat = request(post("/api/combat/chapter/" + fixture.chapter() + "/start"), fixture.playerToken()).path("id").asLong();
        JsonNode state = request(get("/api/combat/" + combat + "/status"), fixture.playerToken());
        assertEquals(combat, state.path("combatId").asLong());
        assertEquals(2, state.path("fighters").size());
        request(get("/api/combat/history"), fixture.playerToken());
        assertEquals(combat, request(get("/api/combat/" + combat + "/status"), fixture.playerToken()).path("combatId").asLong());
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
    }

    @Test
    void masterUpdatesAreCommittedBeforeSubsequentPlayerReads() throws Exception {
        request(put("/api/campaigns/" + fixture.campaign()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("name", "Updated campaign", "description", "Updated story", "difficulty", "BEGINNER"))), fixture.masterToken());
        request(put("/api/campaigns/chapters/" + fixture.chapter()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("title", "Updated chapter", "storyText", "Updated chapter story",
                        "orderIndex", 1, "hasCombat", true, "lessonId", fixture.lesson(), "quizId", fixture.quiz()))), fixture.masterToken());
        JsonNode updated = request(get("/api/campaigns/" + fixture.campaign() + "/chapters"), fixture.playerToken()).get(0);
        assertEquals("Updated campaign", updated.path("campaignName").asText());
        assertEquals("Updated chapter", updated.path("title").asText());
        JsonNode question = request(post("/api/questions").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("quizId", fixture.quiz(), "text", "New teaching question", "answers", List.of(
                        Map.of("text", "Correct", "correct", true), Map.of("text", "Wrong", "correct", false))))), fixture.masterToken());
        assertEquals(2, question.path("answers").size());
        assertEquals(2, questions.findByQuizId(fixture.quiz()).size());
    }

    @Test
    void questionAndAnswersRollbackTogetherIfPersistenceFails() {
        long questionsBefore = questions.count();
        long answersBefore = answers.count();
        CreateQuestionRequest invalid = new CreateQuestionRequest(fixture.quiz(), "Rollback example",
                List.of(new CreateAnswerRequest("Valid first answer", true), new CreateAnswerRequest(null, false)));
        assertThrows(RuntimeException.class, () -> questionService.createQuestion(invalid));
        assertEquals(questionsBefore, questions.count());
        assertEquals(answersBefore, answers.count());
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
    }

    private User account(String name, Role role) {
        User user = User.builder().username(name).email(name + "@example.test").password("test-hash")
                .role(role).learningLevel(LearningLevel.BEGINNER).build();
        entities.persist(user);
        return user;
    }

    private JsonNode request(MockHttpServletRequestBuilder request, String token) throws Exception {
        assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
        String response = mvc.perform(request.header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
