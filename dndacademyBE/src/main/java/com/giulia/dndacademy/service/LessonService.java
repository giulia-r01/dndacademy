package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CreateLessonRequest;
import com.giulia.dndacademy.dto.LessonDTO;
import com.giulia.dndacademy.dto.UserLessonProgressDTO;

import java.util.List;

public interface LessonService {

    LessonDTO createLesson(CreateLessonRequest request);

    List<LessonDTO> getAllLessons();

    LessonDTO getLessonById(Long id);

    List<UserLessonProgressDTO> getMyLessonProgress(String username);

    UserLessonProgressDTO completeLesson(Long lessonId, String username);

    void completeLessonAfterQuiz(Long lessonId, String username);
}