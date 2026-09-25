package com.fesherprep.fesherprep_api.contribution.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.contribution.domain.*;
import com.fesherprep.fesherprep_api.contribution.dto.*;
import com.fesherprep.fesherprep_api.contribution.service.ContributionService;
import com.fesherprep.fesherprep_api.lesson.dto.*;
import com.fesherprep.fesherprep_api.question.dto.*;
import com.fesherprep.fesherprep_api.quiz.dto.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/contributor")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class ContributorController {
    private final ContributionService service;

    @GetMapping("/submissions")
    public Page<ContributionSummaryResponse> mySubmissions(
            @RequestParam(required = false) ContributionContentType type,
            @RequestParam(required = false) ReviewStatus status,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.myContributions(type, status, pageable);
    }

    @GetMapping("/submissions/{submissionId}")
    public ContributionDetailResponse detail(@PathVariable UUID submissionId) {
        return service.myContribution(submissionId);
    }

    @PostMapping("/submissions/{submissionId}/submit")
    public ContributionDetailResponse submit(@PathVariable UUID submissionId) {
        return service.submit(submissionId);
    }

    @PostMapping("/lessons")
    public ResponseEntity<ContributionDetailResponse> createLesson(
            @Valid @RequestBody CreateLessonRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createLesson(request));
    }

    @PutMapping("/lessons/{lessonId}")
    public ContributionDetailResponse updateLesson(
            @PathVariable UUID lessonId, @Valid @RequestBody UpdateLessonRequest request
    ) {
        return service.updateLesson(lessonId, request);
    }

    @PostMapping("/questions")
    public ResponseEntity<ContributionDetailResponse> createQuestion(
            @Valid @RequestBody CreateQuestionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createQuestion(request));
    }

    @PutMapping("/questions/{questionId}")
    public ContributionDetailResponse updateQuestion(
            @PathVariable UUID questionId, @Valid @RequestBody UpdateQuestionRequest request
    ) {
        return service.updateQuestion(questionId, request);
    }

    @PostMapping("/questions/{questionId}/versions")
    public ResponseEntity<ContributionDetailResponse> createVersion(
            @PathVariable UUID questionId, @Valid @RequestBody CreateQuestionVersionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createQuestionVersion(questionId, request));
    }

    @PostMapping("/quizzes")
    public ResponseEntity<ContributionDetailResponse> createQuiz(
            @Valid @RequestBody ContributorQuizRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createQuiz(request));
    }

    @PutMapping("/quizzes/{quizId}")
    public ContributionDetailResponse updateQuiz(
            @PathVariable UUID quizId, @Valid @RequestBody ContributorQuizRequest request
    ) {
        return service.updateQuiz(quizId, request);
    }

    @PostMapping("/quizzes/{quizId}/fixed-questions")
    public ContributionDetailResponse addFixedQuestion(
            @PathVariable UUID quizId, @Valid @RequestBody AddFixedQuestionRequest request
    ) {
        return service.addFixedQuestion(quizId, request);
    }

    @DeleteMapping("/quizzes/{quizId}/fixed-questions/{questionId}")
    public ContributionDetailResponse removeFixedQuestion(
            @PathVariable UUID quizId, @PathVariable UUID questionId
    ) {
        return service.removeFixedQuestion(quizId, questionId);
    }

    @PostMapping("/quizzes/{quizId}/rules")
    public ContributionDetailResponse addRule(
            @PathVariable UUID quizId, @Valid @RequestBody UpsertQuizRuleRequest request
    ) {
        return service.addRule(quizId, request);
    }

    @PutMapping("/quizzes/{quizId}/rules/{ruleId}")
    public ContributionDetailResponse updateRule(
            @PathVariable UUID quizId,
            @PathVariable UUID ruleId,
            @Valid @RequestBody UpsertQuizRuleRequest request
    ) {
        return service.updateRule(quizId, ruleId, request);
    }

    @DeleteMapping("/quizzes/{quizId}/rules/{ruleId}")
    public ContributionDetailResponse removeRule(
            @PathVariable UUID quizId, @PathVariable UUID ruleId
    ) {
        return service.removeRule(quizId, ruleId);
    }
}
