package com.fesherprep.fesherprep_api.quiz.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.quiz.dto.*;
import com.fesherprep.fesherprep_api.quiz.service.QuizService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class QuizController {
    private final QuizService quizService;

    @GetMapping
    public Page<PublishedQuizResponse> getPublishedQuizzes(
            @PageableDefault(size = 20, sort = "title", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return quizService.getPublishedQuizzes(pageable);
    }

    @GetMapping("/{quizId}")
    public PublishedQuizResponse getPublishedQuiz(@PathVariable UUID quizId) {
        return quizService.getPublishedQuiz(quizId);
    }

    @GetMapping("/by-code/{code}")
    public PublishedQuizResponse getPublishedQuizByCode(@PathVariable String code) {
        return quizService.getPublishedQuizByCode(code);
    }

    @PostMapping("/{quizId}/attempts")
    public ResponseEntity<QuizAttemptResponse> startQuiz(@PathVariable UUID quizId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.startQuiz(quizId));
    }

    @GetMapping("/admin")
    public Page<QuizResponse> getAllQuizzes(
            @PageableDefault(size = 20, sort = "title", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return quizService.getAllQuizzes(pageable);
    }

    @GetMapping("/admin/{quizId}")
    public QuizResponse getQuiz(@PathVariable UUID quizId) {
        return quizService.getQuiz(quizId);
    }

    @PostMapping("/admin")
    public ResponseEntity<QuizResponse> createQuiz(@Valid @RequestBody CreateQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createQuiz(request));
    }

    @PutMapping("/admin/{quizId}")
    public QuizResponse updateQuiz(
            @PathVariable UUID quizId,
            @Valid @RequestBody UpdateQuizRequest request
    ) {
        return quizService.updateQuiz(quizId, request);
    }

    @PatchMapping("/admin/{quizId}/status")
    public QuizResponse changeStatus(
            @PathVariable UUID quizId,
            @Valid @RequestBody ChangeQuizStatusRequest request
    ) {
        return quizService.changeStatus(quizId, request);
    }

    @PostMapping("/admin/{quizId}/publish")
    public QuizResponse publishQuiz(@PathVariable UUID quizId) {
        return quizService.publishQuiz(quizId);
    }

    @PostMapping("/admin/{quizId}/archive")
    public QuizResponse archiveQuiz(@PathVariable UUID quizId) {
        return quizService.archiveQuiz(quizId);
    }

    @PostMapping("/admin/{quizId}/fixed-questions")
    public QuizResponse addFixedQuestion(
            @PathVariable UUID quizId,
            @Valid @RequestBody AddFixedQuestionRequest request
    ) {
        return quizService.addFixedQuestion(quizId, request);
    }

    @DeleteMapping("/admin/{quizId}/fixed-questions/{questionId}")
    public QuizResponse removeFixedQuestion(
            @PathVariable UUID quizId,
            @PathVariable UUID questionId
    ) {
        return quizService.removeFixedQuestion(quizId, questionId);
    }

    @PostMapping("/admin/{quizId}/rules")
    public ResponseEntity<QuizResponse> addRule(
            @PathVariable UUID quizId,
            @Valid @RequestBody UpsertQuizRuleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.addRule(quizId, request));
    }

    @PutMapping("/admin/{quizId}/rules/{ruleId}")
    public QuizResponse updateRule(
            @PathVariable UUID quizId,
            @PathVariable UUID ruleId,
            @Valid @RequestBody UpsertQuizRuleRequest request
    ) {
        return quizService.updateRule(quizId, ruleId, request);
    }

    @DeleteMapping("/admin/{quizId}/rules/{ruleId}")
    public QuizResponse removeRule(
            @PathVariable UUID quizId,
            @PathVariable UUID ruleId
    ) {
        return quizService.removeRule(quizId, ruleId);
    }

    @DeleteMapping("/admin/{quizId}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable UUID quizId) {
        quizService.deleteQuiz(quizId);
        return ResponseEntity.noContent().build();
    }
}
