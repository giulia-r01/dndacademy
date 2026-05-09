package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CreateLessonRequest;
import com.giulia.dndacademy.dto.LessonDTO;
import com.giulia.dndacademy.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PostMapping
    public LessonDTO createLesson(@RequestBody @Valid CreateLessonRequest request) {
        return lessonService.createLesson(request);
    }

    @GetMapping
    public List<LessonDTO> getAllLessons() {
        return lessonService.getAllLessons();
    }

    @GetMapping("/{id}")
    public LessonDTO getLessonById(@PathVariable Long id) {
        return lessonService.getLessonById(id);
    }
}