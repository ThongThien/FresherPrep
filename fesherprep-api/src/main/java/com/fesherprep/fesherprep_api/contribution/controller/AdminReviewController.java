package com.fesherprep.fesherprep_api.contribution.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.contribution.domain.*;
import com.fesherprep.fesherprep_api.contribution.dto.*;
import com.fesherprep.fesherprep_api.contribution.service.ContributionService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminReviewController {
    private final ContributionService service;

    @GetMapping
    public Page<ContributionSummaryResponse> queue(
            @RequestParam(required = false) ContributionContentType type,
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) String contributor,
            @RequestParam(required = false) Instant submittedFrom,
            @RequestParam(required = false) Instant submittedTo,
            @PageableDefault(size = 20, sort = "submittedAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return service.reviewQueue(type, status, contributor, submittedFrom, submittedTo, pageable);
    }

    @GetMapping("/{submissionId}")
    public ContributionDetailResponse detail(@PathVariable UUID submissionId) {
        return service.reviewDetail(submissionId);
    }

    @PostMapping("/{submissionId}/approve")
    public ContributionDetailResponse approve(@PathVariable UUID submissionId) {
        return service.approve(submissionId);
    }

    @PostMapping("/{submissionId}/reject")
    public ContributionDetailResponse reject(
            @PathVariable UUID submissionId, @Valid @RequestBody RejectContentRequest request
    ) {
        return service.reject(submissionId, request);
    }
}
