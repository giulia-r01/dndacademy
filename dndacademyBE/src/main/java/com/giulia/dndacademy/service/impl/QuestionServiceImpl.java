package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.Answer;
import com.giulia.dndacademy.model.Question;
import com.giulia.dndacademy.model.Quiz;
import com.giulia.dndacademy.repository.AnswerRepository;
import com.giulia.dndacademy.repository.QuestionRepository;
import com.giulia.dndacademy.repository.QuizRepository;
import com.giulia.dndacademy.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final QuizRepository quizRepository;

    @Override
    public QuestionDTO createQuestion(CreateQuestionRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
                .orElseThrow(() -> new RuntimeException("Quiz non trovato"));

        if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
            throw new RuntimeException("La domanda deve avere almeno una risposta");
        }

        boolean hasCorrectAnswer = request.getAnswers()
                .stream()
                .anyMatch(CreateAnswerRequest::isCorrect);

        if (!hasCorrectAnswer) {
            throw new RuntimeException("La domanda deve avere almeno una risposta corretta");
        }

        Question question = Question.builder()
                .text(request.getText())
                .quiz(quiz)
                .build();

        Question savedQuestion = questionRepository.save(question);

        List<Answer> answers = request.getAnswers()
                .stream()
                .map(answerRequest -> Answer.builder()
                        .text(answerRequest.getText())
                        .correct(answerRequest.isCorrect())
                        .question(savedQuestion)
                        .build())
                .toList();

        answerRepository.saveAll(answers);

        return mapToDTO(savedQuestion);
    }

    @Override
    public List<QuestionDTO> getQuestionsByQuiz(Long quizId) {
        return questionRepository.findByQuizId(quizId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    private QuestionDTO mapToDTO(Question question) {
        List<AnswerDTO> answers = answerRepository.findByQuestionId(question.getId())
                .stream()
                .map(answer -> AnswerDTO.builder()
                        .id(answer.getId())
                        .text(answer.getText())
                        .build())
                .toList();

        return QuestionDTO.builder()
                .id(question.getId())
                .text(question.getText())
                .answers(answers)
                .build();
    }

    @Override
    public QuestionDTO updateQuestion(Long questionId, UpdateQuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Domanda non trovata."));

        question.setText(request.getText().trim());

        Question updatedQuestion = questionRepository.save(question);

        return mapToDTO(updatedQuestion);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Domanda non trovata."));

        answerRepository.deleteByQuestionId(questionId);

        questionRepository.delete(question);
    }

    private AdminQuestionDTO mapToAdminDTO(Question question) {
        List<AdminAnswerDTO> answers = answerRepository.findByQuestionId(question.getId())
                .stream()
                .map(answer -> AdminAnswerDTO.builder()
                        .id(answer.getId())
                        .text(answer.getText())
                        .correct(answer.isCorrect())
                        .build())
                .toList();

        return AdminQuestionDTO.builder()
                .id(question.getId())
                .text(question.getText())
                .answers(answers)
                .build();
    }

    @Override
    public List<AdminQuestionDTO> getAdminQuestionsByQuiz(Long quizId) {
        return questionRepository.findByQuizId(quizId)
                .stream()
                .map(this::mapToAdminDTO)
                .toList();
    }

    @Override
    public AdminQuestionDTO createAnswer(Long questionId, CreateAnswerRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Domanda non trovata."));

        Answer answer = Answer.builder()
                .text(request.getText().trim())
                .correct(request.isCorrect())
                .question(question)
                .build();

        answerRepository.save(answer);

        return mapToAdminDTO(question);
    }

    @Override
    public AdminQuestionDTO updateAnswer(
            Long questionId,
            Long answerId,
            CreateAnswerRequest request
    ) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Domanda non trovata."));

        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Risposta non trovata."));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new RuntimeException("La risposta non appartiene a questa domanda.");
        }

        List<Answer> currentAnswers = answerRepository.findByQuestionId(questionId);

        boolean isOnlyCorrectAnswer = answer.isCorrect()
                && currentAnswers.stream()
                .filter(Answer::isCorrect)
                .count() == 1;

        if (isOnlyCorrectAnswer && !request.isCorrect()) {
            throw new RuntimeException(
                    "La domanda deve avere almeno una risposta corretta."
            );
        }

        answer.setText(request.getText().trim());
        answer.setCorrect(request.isCorrect());

        answerRepository.save(answer);

        return mapToAdminDTO(question);
    }

    @Override
    @Transactional
    public AdminQuestionDTO deleteAnswer(Long questionId, Long answerId) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Domanda non trovata."));

        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Risposta non trovata."));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new RuntimeException("La risposta non appartiene a questa domanda.");
        }

        List<Answer> currentAnswers = answerRepository.findByQuestionId(questionId);

        if (currentAnswers.size() <= 2) {
            throw new RuntimeException(
                    "La domanda deve avere almeno due risposte."
            );
        }

        boolean isOnlyCorrectAnswer = answer.isCorrect()
                && currentAnswers.stream()
                .filter(Answer::isCorrect)
                .count() == 1;

        if (isOnlyCorrectAnswer) {
            throw new RuntimeException(
                    "Non puoi eliminare l'unica risposta corretta della domanda."
            );
        }

        answerRepository.delete(answer);

        return mapToAdminDTO(question);
    }
}