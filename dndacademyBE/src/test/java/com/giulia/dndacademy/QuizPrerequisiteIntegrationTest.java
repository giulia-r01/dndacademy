package com.giulia.dndacademy;

import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.model.enumerations.*;
import com.giulia.dndacademy.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QuizPrerequisiteIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired LessonRepository lessons;
    @Autowired QuizRepository quizzes;
    @Autowired QuestionRepository questions;
    @Autowired AnswerRepository answers;
    @Autowired UserLessonProgressRepository progress;
    @Autowired UserQuizResultRepository results;
    User player, master;
    Lesson lesson;
    Quiz quiz;
    Question first, second;
    Answer rightFirst, rightSecond, wrongSecond;

    @BeforeEach void fixtures() {
        String key = UUID.randomUUID().toString();
        player = users.save(User.builder().username("player" + key).email(key + "@example.test").password("unused").role(Role.PLAYER).learningLevel(LearningLevel.BEGINNER).build());
        master = users.save(User.builder().username("master" + key).email("m" + key + "@example.test").password("unused").role(Role.MASTER).learningLevel(LearningLevel.BEGINNER).build());
        lesson = lessons.save(Lesson.builder().title("Lezione " + key).content("Testo").orderIndex(1).unlockedByDefault(true).build());
        quiz = quizzes.save(Quiz.builder().title("Quiz").lesson(lesson).passingScore(70).build());
        first = questions.save(Question.builder().text("Uno?").quiz(quiz).build());
        second = questions.save(Question.builder().text("Due?").quiz(quiz).build());
        rightFirst = answers.save(Answer.builder().text("Si").correct(true).question(first).build());
        rightSecond = answers.save(Answer.builder().text("Si").correct(true).question(second).build());
        wrongSecond = answers.save(Answer.builder().text("No").correct(false).question(second).build());
    }
    void read(User account, boolean unlocked) {
        progress.saveAndFlush(UserLessonProgress.builder().user(account).lesson(lesson).unlocked(unlocked).completed(true).build());
    }
    String answer(Question question, Answer answer) { return "{\"questionId\":" + question.getId() + ",\"answerId\":" + answer.getId() + "}"; }
    String request(String... entries) { return "{\"quizId\":" + quiz.getId() + ",\"answers\":[" + String.join(",", entries) + "]}"; }

    @Test void unreadPlayerCannotReadQuestionsOrSubmitAndNothingIsAwarded() throws Exception {
        long count = results.count();
        mvc.perform(get("/api/quizzes/lesson/{id}", lesson.getId()).with(user(player))).andExpect(status().isForbidden());
        mvc.perform(get("/api/questions/quiz/{id}", quiz.getId()).with(user(player))).andExpect(status().isForbidden());
        mvc.perform(post("/api/quizzes/submit").with(user(player)).contentType(MediaType.APPLICATION_JSON)
                .content(request(answer(first, rightFirst), answer(second, rightSecond)))).andExpect(status().isForbidden());
        assertEquals(count, results.count());
        assertTrue(progress.findByUserUsernameAndLessonId(player.getUsername(), lesson.getId()).isEmpty());
    }
    @Test void authoringMasterCanInspectButMustReadBeforeSubmitting() throws Exception {
        mvc.perform(get("/api/quizzes/lesson/{id}", lesson.getId()).with(user(master))).andExpect(status().isOk());
        mvc.perform(get("/api/questions/quiz/{id}", quiz.getId()).with(user(master))).andExpect(status().isOk());
        mvc.perform(post("/api/quizzes/submit").with(user(master)).contentType(MediaType.APPLICATION_JSON)
                .content(request(answer(first, rightFirst), answer(second, rightSecond)))).andExpect(status().isForbidden());
    }
    @Test void duplicateAnswersAreRejectedRatherThanTurningFiftyIntoOneHundred() throws Exception {
        read(player, true);
        mvc.perform(post("/api/quizzes/submit").with(user(player)).contentType(MediaType.APPLICATION_JSON)
                .content(request(answer(first, rightFirst), answer(first, rightFirst), answer(second, wrongSecond)))).andExpect(status().isBadRequest());
        assertTrue(results.findByUserUsername(player.getUsername()).isEmpty());
        mvc.perform(post("/api/quizzes/submit").with(user(player)).contentType(MediaType.APPLICATION_JSON)
                .content(request(answer(first, rightFirst), answer(second, wrongSecond)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(50)).andExpect(jsonPath("$.passed").value(false));
    }
    @Test void validCompletedLessonAllowsPassingWithoutExceedingOneHundred() throws Exception {
        read(player, true);
        mvc.perform(get("/api/questions/quiz/{id}", quiz.getId()).with(user(player))).andExpect(status().isOk());
        mvc.perform(post("/api/quizzes/submit").with(user(player)).contentType(MediaType.APPLICATION_JSON)
                .content(request(answer(first, rightFirst), answer(second, rightSecond)))).andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(100)).andExpect(jsonPath("$.passed").value(true));
    }
    @Test void anotherUsersReadingOrLockedProgressDoesNotUnlockQuiz() throws Exception {
        read(master, true);
        read(player, false);
        mvc.perform(get("/api/questions/quiz/{id}", quiz.getId()).with(user(player))).andExpect(status().isForbidden());
    }
    @Test void emptyQuizCannotProduceResults() throws Exception {
        Lesson emptyLesson = lessons.save(Lesson.builder().title("Lezione vuota").content("Testo").orderIndex(2).unlockedByDefault(true).build());
        Quiz emptyQuiz = quizzes.save(Quiz.builder().title("Quiz vuoto").lesson(emptyLesson).passingScore(70).build());
        progress.saveAndFlush(UserLessonProgress.builder().user(player).lesson(emptyLesson).unlocked(true).completed(true).build());
        long count = results.count();
        mvc.perform(post("/api/quizzes/submit").with(user(player)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"quizId\":" + emptyQuiz.getId() + ",\"answers\":[" + answer(first, rightFirst) + "]}"))
                .andExpect(status().isConflict());
        assertEquals(count, results.count());
    }
}
