package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.CreateQuestionRequest;
import com.giulia.dndacademy.dto.QuestionDTO;
import com.giulia.dndacademy.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}