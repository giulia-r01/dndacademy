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
}