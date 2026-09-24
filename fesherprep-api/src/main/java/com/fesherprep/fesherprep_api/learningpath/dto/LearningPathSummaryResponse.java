package com.fesherprep.fesherprep_api.learningpath.dto;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPath;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.time.Instant;
import java.util.UUID;

public record LearningPathSummaryResponse(
        UUID id,
        String name,
        String slug,
        UUID technologyId,
        String technologyName,
        ContentStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static LearningPathSummaryResponse from(LearningPath path) {
        return new LearningPathSummaryResponse(
                path.getId(),
                path.getName(),
                path.getSlug(),
                path.getTechnology().getId(),
                path.getTechnology().getName(),
                path.getStatus(),
                path.getCreatedAt(),
                path.getUpdatedAt()
        );
    }
}
