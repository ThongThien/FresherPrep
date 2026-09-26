package com.fesherprep.fesherprep_api.question.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.question.dto.*;
import com.fesherprep.fesherprep_api.question.service.QuestionService;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class QuestionController {
    private final QuestionService questionService;

    @GetMapping
    public Page<QuestionResponse> getAllQuestions(
            @RequestParam(required = false) QuestionLanguage language,
            @RequestParam(required = false) QuestionCategory category,
            @RequestParam(required = false) UUID knowledgeNodeId,
            @RequestParam(required = false) Difficulty difficulty,
            @RequestParam(required = false) ContentStatus status,
            @PageableDefault(size = 20, sort = "code", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return questionService.getAllQuestions(language, category, knowledgeNodeId, difficulty, status, pageable);
    }

    @GetMapping("/{questionId}")
    public QuestionResponse getQuestion(@PathVariable UUID questionId) {
        return questionService.getQuestion(questionId);
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> createQuestion(
            @Valid @RequestBody CreateQuestionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createQuestion(request));
    }

    @PostMapping("/batch")
    public ResponseEntity<List<BatchCreatedQuestionResponse>> createBatch(
            @Valid @RequestBody BatchCreateQuestionsRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(questionService.createBatch(request));
    }

    @PutMapping("/{questionId}")
    public QuestionResponse updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request
    ) {
        return questionService.updateQuestion(questionId, request);
    }

    @PatchMapping("/{questionId}/status")
    public QuestionResponse changeStatus(
            @PathVariable UUID questionId,
            @Valid @RequestBody ChangeQuestionStatusRequest request
    ) {
        return questionService.changeStatus(questionId, request);
    }

    @GetMapping("/{questionId}/versions")
    public List<QuestionVersionResponse> getVersions(@PathVariable UUID questionId) {
        return questionService.getVersions(questionId);
    }

    @GetMapping("/{questionId}/versions/{versionId}")
    public QuestionVersionResponse getVersion(
            @PathVariable UUID questionId,
            @PathVariable UUID versionId
    ) {
        return questionService.getVersion(questionId, versionId);
    }

    @PostMapping("/{questionId}/versions")
    public ResponseEntity<QuestionVersionResponse> createVersion(
            @PathVariable UUID questionId,
            @Valid @RequestBody CreateQuestionVersionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionService.createVersion(questionId, request));
    }

    @PostMapping("/{questionId}/versions/{versionId}/revisions")
    public ResponseEntity<QuestionVersionResponse> createRevision(
            @PathVariable UUID questionId,
            @PathVariable UUID versionId,
            @Valid @RequestBody UpdateQuestionVersionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(questionService.createRevision(questionId, versionId, request));
    }

    @PostMapping("/{questionId}/versions/{versionId}/publish")
    public QuestionResponse publishVersion(
            @PathVariable UUID questionId,
            @PathVariable UUID versionId
    ) {
        return questionService.publishVersion(questionId, versionId);
    }

    @DeleteMapping("/{questionId}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID questionId) {
        questionService.deleteQuestion(questionId);
        return ResponseEntity.noContent().build();
    }
}
