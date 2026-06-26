package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.Answer;
import com.giulia.dndacademy.model.Lesson;
import com.giulia.dndacademy.model.Quiz;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.repository.*;
import com.giulia.dndacademy.service.BadgeService;
import com.giulia.dndacademy.service.LessonService;
import com.giulia.dndacademy.service.QuizService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.UserQuizResult;

import java.time.LocalDateTime;
import java.util.List;


@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final LessonRepository lessonRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserService userService;
    private final UserQuizResultRepository userQuizResultRepository;
    private final LessonService lessonService;
    private final BadgeService badgeService;
    private final UserLessonProgressRepository userLessonProgressRepository;
    private final CampaignChapterRepository campaignChapterRepository;

    @Override
    public QuizDTO createQuiz(CreateQuizRequest request) {
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new RuntimeException("Lezione non trovata."));

        if (quizRepository.existsByLessonId(request.getLessonId())) {
            throw new RuntimeException(
                    "Questa lezione ha già un quiz associato. Ogni lezione può avere un solo quiz."
            );
        }

        Quiz quiz = Quiz.builder()
                .title(request.getTitle().trim())
                .lesson(lesson)
                .passingScore(request.getPassingScore())
                .build();

        Quiz savedQuiz = quizRepository.save(quiz);

        return mapToDTO(savedQuiz);
    }

    @Override
    public List<QuizDTO> getAllQuizzes() {
        return quizRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public QuizDTO getQuizById(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trovato."));

        return mapToDTO(quiz);
    }

    @Override
    public QuizDTO getQuizByLesson(Long lessonId) {
        Quiz quiz = quizRepository.findByLessonId(lessonId)
                .orElseThrow(() -> new RuntimeException("Quiz non trovato per questa lezione."));

        return mapToDTO(quiz);
    }

    @Override
    public QuizResultDTO submitQuiz(SubmitQuizRequest request, String username) {

        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz non trovato"));

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            throw new RuntimeException("Devi inviare almeno una risposta");
        }

        int totalQuestions = questionRepository.findByQuizId(quiz.getId()).size();

        long distinctQuestionsAnswered = request.getAnswers()
                .stream()
                .map(SubmitAnswerRequest::getQuestionId)
                .distinct()
                .count();

        if (distinctQuestionsAnswered != totalQuestions) {
            throw new RuntimeException("Devi rispondere a tutte le domande del quiz");
        }

        int correctAnswers = 0;

        for (SubmitAnswerRequest submitted : request.getAnswers()) {
            Answer answer = answerRepository.findById(submitted.getAnswerId())
                    .orElseThrow(() -> new RuntimeException("Risposta non trovata"));

            if (!answer.getQuestion().getId().equals(submitted.getQuestionId())) {
                throw new RuntimeException("La risposta non appartiene alla domanda indicata");
            }

            if (!answer.getQuestion().getQuiz().getId().equals(quiz.getId())) {
                throw new RuntimeException("La domanda non appartiene a questo quiz");
            }

            if (answer.isCorrect()) {
                correctAnswers++;
            }
        }

        int score = totalQuestions == 0 ? 0 : (correctAnswers * 100) / totalQuestions;
        boolean passed = score >= quiz.getPassingScore();

        boolean alreadyPassed = userQuizResultRepository
                .existsByUserUsernameAndQuizIdAndPassedTrue(username, quiz.getId());

        User user = userService.getByUsername(username);

        UserQuizResult result = UserQuizResult.builder()
                .user(user)
                .quiz(quiz)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .score(score)
                .passed(passed)
                .completedAt(LocalDateTime.now())
                .build();

        userQuizResultRepository.save(result);

        if (passed && !alreadyPassed) {
            lessonService.completeLessonAfterQuiz(quiz.getLesson().getId(), username);
            badgeService.assignBadge(username, "Primo Quiz");
            userService.updateLearningLevel(username);

            long completedLessons = userLessonProgressRepository
                    .findByUserUsernameOrderByLessonOrderIndexAsc(username)
                    .stream()
                    .filter(progress -> progress.isCompleted())
                    .count();

            long passedQuizzes = userQuizResultRepository
                    .countDistinctPassedQuizzesByUsername(username);

            if (completedLessons >= 2 && passedQuizzes >= 2) {
                badgeService.assignBadge(username, "Studente di D&D");
            }

            User updatedUser = userService.getByUsername(username);

            if (updatedUser.getLearningLevel() == LearningLevel.INTERMEDIATE) {
                badgeService.assignBadge(username, "Avventuriero Esperto");
            }
        }

        return QuizResultDTO.builder()
                .quizId(quiz.getId())
                .totalQuestions(totalQuestions)
                .correctAnswers(correctAnswers)
                .score(score)
                .passed(passed)
                .build();
    }

    @Override
    public List<UserQuizResultDTO> getMyQuizResults(String username) {
        return userQuizResultRepository.findByUserUsername(username)
                .stream()
                .map(result -> UserQuizResultDTO.builder()
                        .id(result.getId())
                        .quizId(result.getQuiz().getId())
                        .quizTitle(result.getQuiz().getTitle())
                        .score(result.getScore())
                        .passed(result.isPassed())
                        .completedAt(result.getCompletedAt())
                        .build())
                .toList();
    }

    @Override
    public QuizDTO updateQuiz(Long quizId, UpdateQuizRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trovato."));

        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new RuntimeException("Lezione non trovata."));

        if (quizRepository.existsByLessonIdAndIdNot(request.getLessonId(), quizId)) {
            throw new RuntimeException(
                    "Questa lezione ha già un quiz associato. Scegli un'altra lezione."
            );
        }

        quiz.setTitle(request.getTitle().trim());
        quiz.setLesson(lesson);
        quiz.setPassingScore(request.getPassingScore());

        Quiz updatedQuiz = quizRepository.save(quiz);

        return mapToDTO(updatedQuiz);
    }

    @Override
    public void deleteQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz non trovato."));

        if (questionRepository.existsByQuizId(quizId)) {
            throw new RuntimeException(
                    "Non puoi eliminare questo quiz perché contiene ancora una o più domande. Elimina prima tutte le domande associate."
            );
        }

        if (userQuizResultRepository.existsByQuizId(quizId)) {
            throw new RuntimeException(
                    "Non puoi eliminare questo quiz perché è già stato svolto da uno o più utenti."
            );
        }

        if (campaignChapterRepository.existsByQuizId(quizId)) {
            throw new RuntimeException(
                    "Non puoi eliminare questo quiz perché è collegato a uno o più capitoli. Rimuovi prima il collegamento dai capitoli."
            );
        }

        quizRepository.delete(quiz);
    }

    private QuizDTO mapToDTO(Quiz quiz) {
        return QuizDTO.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .lessonId(quiz.getLesson().getId())
                .lessonTitle(quiz.getLesson().getTitle())
                .passingScore(quiz.getPassingScore())
                .questionCount(questionRepository.countByQuizId(quiz.getId()))
                .hasResults(userQuizResultRepository.existsByQuizId(quiz.getId()))
                .usedInChapters(campaignChapterRepository.existsByQuizId(quiz.getId()))
                .build();
    }
}