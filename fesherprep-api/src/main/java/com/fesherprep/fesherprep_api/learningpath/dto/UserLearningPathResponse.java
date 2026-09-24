package com.fesherprep.fesherprep_api.learningpath.dto;

import com.fesherprep.fesherprep_api.learningpath.domain.UserLearningPath;

import java.time.Instant;
import java.util.UUID;

public record UserLearningPathResponse(
        UUID id,
        Instant joinedAt,
        LearningPathSummaryResponse learningPath
) {
    public static UserLearningPathResponse from(UserLearningPath membership) {
        return new UserLearningPathResponse(
                membership.getId(),
                membership.getCreatedAt(),
                LearningPathSummaryResponse.from(membership.getLearningPath())
        );
    }
}
