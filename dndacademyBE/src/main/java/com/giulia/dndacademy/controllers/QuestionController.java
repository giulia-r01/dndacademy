package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping
    public QuestionDTO createQuestion(@RequestBody @Valid CreateQuestionRequest request) {
        return questionService.createQuestion(request);
    }

    @GetMapping("/quiz/{quizId}")
    public List<QuestionDTO> getQuestionsByQuiz(@PathVariable Long quizId) {
        return questionService.getQuestionsByQuiz(quizId);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PutMapping("/{questionId}")
    public QuestionDTO updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody UpdateQuestionRequest request
    ) {
        return questionService.updateQuestion(questionId, request);
    }

    @PreAuthorize("hasRole('MASTER')")
    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('MASTER')")
    @GetMapping("/admin/quiz/{quizId}")
    public List<AdminQuestionDTO> getAdminQuestionsByQuiz(@PathVariable Long quizId) {
        return questionService.getAdminQuestionsByQuiz(quizId);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PostMapping("/{questionId}/answers")
    public AdminQuestionDTO createAnswer(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        return questionService.createAnswer(questionId, request);
    }

    @PreAuthorize("hasRole('MASTER')")
    @PutMapping("/{questionId}/answers/{answerId}")
    public AdminQuestionDTO updateAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            @Valid @RequestBody CreateAnswerRequest request
    ) {
        return questionService.updateAnswer(questionId, answerId, request);
    }

    @PreAuthorize("hasRole('MASTER')")
    @DeleteMapping("/{questionId}/answers/{answerId}")
    public AdminQuestionDTO deleteAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId
    ) {
        return questionService.deleteAnswer(questionId, answerId);
    }
}