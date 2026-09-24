package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuestionVersionResponse(
        UUID id,
        UUID questionId,
        int versionNumber,
        String content,
        String explanation,
        Instant createdAt,
        List<QuestionOptionResponse> options
) {
    public static QuestionVersionResponse from(QuestionVersion version) {
        return new QuestionVersionResponse(
                version.getId(),
                version.getQuestion().getId(),
                version.getVersionNumber(),
                version.getContent(),
                version.getExplanation(),
                version.getCreatedAt(),
                version.getOptions().stream().map(QuestionOptionResponse::from).toList()
        );
    }
}
