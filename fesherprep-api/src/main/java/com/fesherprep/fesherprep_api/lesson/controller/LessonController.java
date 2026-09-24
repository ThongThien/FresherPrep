package com.fesherprep.fesherprep_api.lesson.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.lesson.dto.*;
import com.fesherprep.fesherprep_api.lesson.service.LessonAssessmentService;
import com.fesherprep.fesherprep_api.lesson.service.LessonService;
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
@RequestMapping("/api/lessons")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class LessonController {
    private final LessonService lessonService;
    private final LessonAssessmentService lessonAssessmentService;

    @GetMapping
    public Page<LessonSummaryResponse> getPublishedLessons(
            @RequestParam UUID subtopicId,
            @PageableDefault(size = 20, sort = { "displayOrder", "title" }) Pageable pageable
    ) {
        return lessonService.getPublishedLessons(subtopicId, pageable);
    }

    @GetMapping("/{lessonId}")
    public LessonDetailResponse getPublishedLesson(@PathVariable UUID lessonId) {
        return lessonService.getPublishedLesson(lessonId);
    }

    @GetMapping("/by-slug/{slug}")
    public LessonDetailResponse getPublishedLessonBySlug(@PathVariable String slug) {
        return lessonService.getPublishedLessonBySlug(slug);
    }

    @GetMapping("/{lessonId}/prerequisites")
    public List<LessonSummaryResponse> getPublishedPrerequisites(@PathVariable UUID lessonId) {
        return lessonService.getPublishedPrerequisites(lessonId);
    }

    @PostMapping("/{lessonId}/progress/start")
    public LessonProgressResponse startProgress(@PathVariable UUID lessonId) {
        return lessonService.startProgress(lessonId);
    }

    @PatchMapping("/{lessonId}/progress")
    public LessonProgressResponse recordProgress(
            @PathVariable UUID lessonId,
            @Valid @RequestBody RecordLessonProgressRequest request
    ) {
        return lessonService.recordProgress(lessonId, request);
    }

    @GetMapping("/{lessonId}/progress")
    public LessonProgressResponse getMyProgress(@PathVariable UUID lessonId) {
        return lessonService.getMyProgress(lessonId);
    }

    @GetMapping("/me/progress")
    public Page<LessonProgressResponse> getMyProgress(
            @PageableDefault(size = 20, sort = "lastViewedAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return lessonService.getMyProgress(pageable);
    }

    @GetMapping("/admin")
    public Page<LessonSummaryResponse> getAllLessons(
            @PageableDefault(size = 20, sort = { "displayOrder", "title" }) Pageable pageable
    ) {
        return lessonService.getAllLessons(pageable);
    }

    @GetMapping("/admin/{lessonId}")
    public LessonDetailResponse getLesson(@PathVariable UUID lessonId) {
        return lessonService.getLesson(lessonId);
    }

    @PostMapping("/admin")
    public ResponseEntity<LessonDetailResponse> createLesson(
            @Valid @RequestBody CreateLessonRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(lessonService.createLesson(request));
    }

    @PutMapping("/admin/{lessonId}")
    public LessonDetailResponse updateLesson(
            @PathVariable UUID lessonId,
            @Valid @RequestBody UpdateLessonRequest request
    ) {
        return lessonService.updateLesson(lessonId, request);
    }

    @PatchMapping("/admin/{lessonId}/status")
    public LessonDetailResponse changeStatus(
            @PathVariable UUID lessonId,
            @Valid @RequestBody ChangeLessonStatusRequest request
    ) {
        return lessonService.changeStatus(lessonId, request);
    }

    @PostMapping("/admin/{lessonId}/publish")
    public LessonDetailResponse publishLesson(@PathVariable UUID lessonId) {
        return lessonService.publishLesson(lessonId);
    }

    @PostMapping("/admin/{lessonId}/archive")
    public LessonDetailResponse archiveLesson(@PathVariable UUID lessonId) {
        return lessonService.archiveLesson(lessonId);
    }

    @PostMapping("/admin/{lessonId}/prerequisites/{prerequisiteLessonId}")
    public List<LessonSummaryResponse> addPrerequisite(
            @PathVariable UUID lessonId,
            @PathVariable UUID prerequisiteLessonId
    ) {
        return lessonService.addPrerequisite(lessonId, prerequisiteLessonId);
    }

    @DeleteMapping("/admin/{lessonId}/prerequisites/{prerequisiteLessonId}")
    public ResponseEntity<Void> removePrerequisite(
            @PathVariable UUID lessonId,
            @PathVariable UUID prerequisiteLessonId
    ) {
        lessonService.removePrerequisite(lessonId, prerequisiteLessonId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/{lessonId}/assessment")
    public LessonAssessmentResponse getAssessment(@PathVariable UUID lessonId) {
        return lessonAssessmentService.getAssessment(lessonId);
    }

    @PostMapping("/admin/{lessonId}/assessment")
    public ResponseEntity<LessonAssessmentResponse> assignAssessment(
            @PathVariable UUID lessonId,
            @Valid @RequestBody AssignLessonAssessmentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lessonAssessmentService.assignAssessment(lessonId, request));
    }

    @DeleteMapping("/admin/{lessonId}/assessment")
    public ResponseEntity<Void> removeAssessment(@PathVariable UUID lessonId) {
        lessonAssessmentService.removeAssessment(lessonId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/admin/{lessonId}")
    public ResponseEntity<Void> deleteLesson(@PathVariable UUID lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.noContent().build();
    }
}
