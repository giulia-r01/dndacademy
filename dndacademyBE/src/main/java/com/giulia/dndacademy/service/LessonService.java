package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.CreateLessonRequest;
import com.giulia.dndacademy.dto.LessonDTO;

import java.util.List;

public interface LessonService {

    LessonDTO createLesson(CreateLessonRequest request);

    List<LessonDTO> getAllLessons();

    LessonDTO getLessonById(Long id);
}