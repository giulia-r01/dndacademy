package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.*;

import java.util.List;

public interface QuestionService {

    QuestionDTO createQuestion(CreateQuestionRequest request);

    List<QuestionDTO> getQuestionsByQuiz(Long quizId);

    QuestionDTO updateQuestion(Long questionId, UpdateQuestionRequest request);

    void deleteQuestion(Long questionId);

    List<AdminQuestionDTO> getAdminQuestionsByQuiz(Long quizId);

    AdminQuestionDTO createAnswer(Long questionId, CreateAnswerRequest request);

    AdminQuestionDTO updateAnswer(
            Long questionId,
            Long answerId,
            CreateAnswerRequest request
    );

    AdminQuestionDTO deleteAnswer(Long questionId, Long answerId);
}