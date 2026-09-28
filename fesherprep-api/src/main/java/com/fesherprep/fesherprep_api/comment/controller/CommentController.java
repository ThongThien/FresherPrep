package com.fesherprep.fesherprep_api.comment.controller;

import com.fesherprep.fesherprep_api.comment.dto.*;
import com.fesherprep.fesherprep_api.comment.service.CommentService;
import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class CommentController {
    private final CommentService service;

    @GetMapping("/lessons/{lessonId}")
    public Page<CommentResponse> getLessonComments(
            @PathVariable UUID lessonId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.getLessonComments(lessonId, pageable);
    }

    @PostMapping("/lessons/{lessonId}")
    public ResponseEntity<CommentResponse> createLessonComment(
            @PathVariable UUID lessonId, @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createLessonComment(lessonId, request));
    }

    @GetMapping("/quizzes/{quizId}")
    public Page<CommentResponse> getQuizComments(
            @PathVariable UUID quizId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.getQuizComments(quizId, pageable);
    }

    @PostMapping("/quizzes/{quizId}")
    public ResponseEntity<CommentResponse> createQuizComment(
            @PathVariable UUID quizId, @Valid @RequestBody CommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createQuizComment(quizId, request));
    }

    @GetMapping("/me")
    public Page<CommentResponse> getMyComments(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.getMyComments(pageable);
    }

    @PutMapping("/{commentId}")
    public CommentResponse updateComment(
            @PathVariable UUID commentId, @Valid @RequestBody CommentRequest request
    ) {
        return service.updateComment(commentId, request);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable UUID commentId) {
        service.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
