package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.*;
import java.util.List;

public interface QuizService {

    QuizDTO createQuiz(CreateQuizRequest request);

    QuizDTO getQuizByLesson(Long lessonId);

    QuizResultDTO submitQuiz(SubmitQuizRequest request, String username);

    List<UserQuizResultDTO> getMyQuizResults(String username);
}