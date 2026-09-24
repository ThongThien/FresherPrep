package com.fesherprep.fesherprep_api.learningpath.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.learningpath.dto.*;
import com.fesherprep.fesherprep_api.learningpath.service.LearningPathService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/learning-paths")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class LearningPathController {
    private final LearningPathService learningPathService;

    @GetMapping
    @SecurityRequirements
    public Page<LearningPathSummaryResponse> getPublishedPaths(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return learningPathService.getPublishedPaths(pageable);
    }

    @GetMapping("/{pathId}")
    @SecurityRequirements
    public LearningPathDetailResponse getPublishedPath(@PathVariable UUID pathId) {
        return learningPathService.getPublishedPath(pathId);
    }

    @PostMapping("/{pathId}/join")
    public ResponseEntity<UserLearningPathResponse> joinPath(@PathVariable UUID pathId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningPathService.joinPath(pathId));
    }

    @GetMapping("/me")
    public Page<UserLearningPathResponse> getMyPaths(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return learningPathService.getMyPaths(pageable);
    }

    @GetMapping("/{pathId}/progress")
    public LearningPathProgressResponse getMyPathProgress(@PathVariable UUID pathId) {
        return learningPathService.getMyPathProgress(pathId);
    }

    @GetMapping("/admin")
    public Page<LearningPathSummaryResponse> getAllPaths(
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return learningPathService.getAllPaths(pageable);
    }

    @GetMapping("/admin/{pathId}")
    public LearningPathDetailResponse getPath(@PathVariable UUID pathId) {
        return learningPathService.getPath(pathId);
    }

    @PostMapping("/admin")
    public ResponseEntity<LearningPathDetailResponse> createPath(
            @Valid @RequestBody CreateLearningPathRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningPathService.createPath(request));
    }

    @PutMapping("/admin/{pathId}")
    public LearningPathDetailResponse updatePath(
            @PathVariable UUID pathId,
            @Valid @RequestBody UpdateLearningPathRequest request
    ) {
        return learningPathService.updatePath(pathId, request);
    }

    @PatchMapping("/admin/{pathId}/status")
    public LearningPathDetailResponse changeStatus(
            @PathVariable UUID pathId,
            @Valid @RequestBody ChangeLearningPathStatusRequest request
    ) {
        return learningPathService.changeStatus(pathId, request);
    }

    @PostMapping("/admin/{pathId}/publish")
    public LearningPathDetailResponse publishPath(@PathVariable UUID pathId) {
        return learningPathService.publishPath(pathId);
    }

    @PostMapping("/admin/{pathId}/archive")
    public LearningPathDetailResponse archivePath(@PathVariable UUID pathId) {
        return learningPathService.archivePath(pathId);
    }

    @PostMapping("/admin/{pathId}/items")
    public ResponseEntity<LearningPathDetailResponse> addItem(
            @PathVariable UUID pathId,
            @Valid @RequestBody AddLearningPathItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(learningPathService.addItem(pathId, request));
    }

    @PutMapping("/admin/{pathId}/items/{itemId}")
    public LearningPathDetailResponse updateItem(
            @PathVariable UUID pathId,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateLearningPathItemRequest request
    ) {
        return learningPathService.updateItem(pathId, itemId, request);
    }

    @DeleteMapping("/admin/{pathId}/items/{itemId}")
    public LearningPathDetailResponse removeItem(
            @PathVariable UUID pathId,
            @PathVariable UUID itemId
    ) {
        return learningPathService.removeItem(pathId, itemId);
    }

    @DeleteMapping("/admin/{pathId}")
    public ResponseEntity<Void> deletePath(@PathVariable UUID pathId) {
        learningPathService.deletePath(pathId);
        return ResponseEntity.noContent().build();
    }
}
