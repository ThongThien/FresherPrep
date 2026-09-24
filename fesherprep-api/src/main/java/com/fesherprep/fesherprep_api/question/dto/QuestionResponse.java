package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.time.Instant;
import java.util.UUID;

public record QuestionResponse(
        UUID id,
        UUID subtopicId,
        String code,
        Difficulty difficulty,
        ContentStatus status,
        UUID publishedVersionId,
        Instant createdAt,
        Instant updatedAt
) {
    public static QuestionResponse from(Question question) {
        return new QuestionResponse(
                question.getId(),
                question.getSubtopic().getId(),
                question.getCode(),
                question.getDifficulty(),
                question.getStatus(),
                question.getPublishedVersion() == null ? null : question.getPublishedVersion().getId(),
                question.getCreatedAt(),
                question.getUpdatedAt()
        );
    }
}
