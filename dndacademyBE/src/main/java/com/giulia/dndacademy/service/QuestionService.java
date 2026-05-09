package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CreateQuestionRequest;
import com.giulia.dndacademy.dto.QuestionDTO;

import java.util.List;

public interface QuestionService {

    QuestionDTO createQuestion(CreateQuestionRequest request);

    List<QuestionDTO> getQuestionsByQuiz(Long quizId);
}