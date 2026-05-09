package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.CreateLessonRequest;
import com.giulia.dndacademy.dto.LessonDTO;
import com.giulia.dndacademy.model.Lesson;
import com.giulia.dndacademy.repository.LessonRepository;
import com.giulia.dndacademy.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;

    @Override
    public LessonDTO createLesson(CreateLessonRequest request) {
        Lesson lesson = Lesson.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .orderIndex(request.getOrderIndex())
                .unlockedByDefault(request.isUnlockedByDefault())
                .build();

        return mapToDTO(lessonRepository.save(lesson));
    }

    @Override
    public List<LessonDTO> getAllLessons() {
        return lessonRepository.findAllByOrderByOrderIndexAsc()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public LessonDTO getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata"));

        return mapToDTO(lesson);
    }

    private LessonDTO mapToDTO(Lesson lesson) {
        return LessonDTO.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .content(lesson.getContent())
                .orderIndex(lesson.getOrderIndex())
                .unlockedByDefault(lesson.isUnlockedByDefault())
                .build();
    }
}