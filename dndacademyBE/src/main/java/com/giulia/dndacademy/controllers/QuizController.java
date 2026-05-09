package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping
    public QuizDTO createQuiz(@RequestBody @Valid CreateQuizRequest request) {
        return quizService.createQuiz(request);
    }

    @GetMapping("/lesson/{lessonId}")
    public QuizDTO getQuizByLesson(@PathVariable Long lessonId) {
        return quizService.getQuizByLesson(lessonId);
    }

    @PostMapping("/submit")
    public QuizResultDTO submitQuiz(
            @RequestBody SubmitQuizRequest request,
            Authentication authentication
    ) {
        String username = authentication.getName();
        return quizService.submitQuiz(request, username);
    }

    @GetMapping("/me/results")
    public List<UserQuizResultDTO> getMyResults(Authentication authentication) {
        String username = authentication.getName();
        return quizService.getMyQuizResults(username);
    }
}