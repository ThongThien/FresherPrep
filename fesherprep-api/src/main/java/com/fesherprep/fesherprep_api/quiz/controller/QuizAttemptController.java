package com.fesherprep.fesherprep_api.quiz.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.quiz.dto.QuizAttemptResponse;
import com.fesherprep.fesherprep_api.quiz.dto.QuizAttemptSummaryResponse;
import com.fesherprep.fesherprep_api.quiz.dto.SubmitQuizAttemptRequest;
import com.fesherprep.fesherprep_api.quiz.service.QuizService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/quiz-attempts")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class QuizAttemptController {
    private final QuizService quizService;

    @PostMapping("/{attemptId}/submit")
    public QuizAttemptResponse submitAttempt(
            @PathVariable UUID attemptId,
            @Valid @RequestBody SubmitQuizAttemptRequest request
    ) {
        return quizService.submitAttempt(attemptId, request);
    }

    @GetMapping("/{attemptId}")
    public QuizAttemptResponse getMyAttempt(@PathVariable UUID attemptId) {
        return quizService.getMyAttempt(attemptId);
    }

    @GetMapping
    public Page<QuizAttemptSummaryResponse> getMyAttemptHistory(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return quizService.getMyAttemptHistory(pageable);
    }
}
