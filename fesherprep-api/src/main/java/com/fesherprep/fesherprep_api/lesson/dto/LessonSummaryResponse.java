package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.util.UUID;

public record LessonSummaryResponse(
        UUID id,
        UUID subtopicId,
        String title,
        String slug,
        ContentStatus status,
        int displayOrder,
        int minimumReadSeconds,
        int requiredScrollPercent
) {
    public static LessonSummaryResponse from(Lesson lesson) {
        return new LessonSummaryResponse(
                lesson.getId(),
                lesson.getSubtopic().getId(),
                lesson.getTitle(),
                lesson.getSlug(),
                lesson.getStatus(),
                lesson.getDisplayOrder(),
                lesson.getMinimumReadSeconds(),
                lesson.getRequiredScrollPercent()
        );
    }
}
