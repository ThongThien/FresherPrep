package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LessonDetailResponse(
        UUID id,
        UUID subtopicId,
        String title,
        String slug,
        String content,
        ContentStatus status,
        int displayOrder,
        int minimumReadSeconds,
        int requiredScrollPercent,
        Instant createdAt,
        Instant updatedAt,
        List<LessonSummaryResponse> prerequisites
) {
    public static LessonDetailResponse from(Lesson lesson, List<LessonSummaryResponse> prerequisites) {
        return new LessonDetailResponse(
                lesson.getId(),
                lesson.getSubtopic().getId(),
                lesson.getTitle(),
                lesson.getSlug(),
                lesson.getContent(),
                lesson.getStatus(),
                lesson.getDisplayOrder(),
                lesson.getMinimumReadSeconds(),
                lesson.getRequiredScrollPercent(),
                lesson.getCreatedAt(),
                lesson.getUpdatedAt(),
                List.copyOf(prerequisites)
        );
    }
}
