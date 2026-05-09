package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CreateLessonRequest;
import com.giulia.dndacademy.dto.LessonDTO;
import com.giulia.dndacademy.dto.UserLessonProgressDTO;
import com.giulia.dndacademy.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;

    @PreAuthorize("hasRole('MASTER')")
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

    @GetMapping("/me/progress")
    public List<UserLessonProgressDTO> getMyProgress(Authentication authentication) {
        String username = authentication.getName();
        return lessonService.getMyLessonProgress(username);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping("/{lessonId}/complete")
    public UserLessonProgressDTO completeLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return lessonService.completeLesson(lessonId, username);
    }
}