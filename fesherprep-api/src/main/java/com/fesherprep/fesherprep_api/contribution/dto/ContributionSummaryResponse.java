package com.fesherprep.fesherprep_api.contribution.dto;

import com.fesherprep.fesherprep_api.contribution.domain.*;

import java.time.Instant;
import java.util.UUID;

public record ContributionSummaryResponse(
        UUID id,
        ContributionContentType contentType,
        UUID contentId,
        String title,
        ReviewStatus status,
        UUID contributorId,
        String contributorName,
        String contributorEmail,
        String reviewComment,
        Instant createdAt,
        Instant updatedAt,
        Instant submittedAt,
        Instant reviewedAt
) {
    public static ContributionSummaryResponse from(ContentSubmission submission) {
        return new ContributionSummaryResponse(
                submission.getId(), submission.getContentType(), submission.getContentId(),
                submission.getContentTitle(), submission.getStatus(),
                submission.getSubmittedBy().getId(), submission.getSubmittedBy().getDisplayName(),
                submission.getSubmittedBy().getEmail(), submission.getReviewComment(),
                submission.getCreatedAt(), submission.getUpdatedAt(), submission.getSubmittedAt(),
                submission.getReviewedAt()
        );
    }
}
