package com.fesherprep.fesherprep_api.learningpath.dto;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPathItem;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.util.UUID;

public record LearningPathItemResponse(
        UUID id,
        UUID lessonId,
        String lessonTitle,
        String lessonSlug,
        ContentStatus lessonStatus,
        int displayOrder,
        boolean required,
        int weight
) {
    public static LearningPathItemResponse from(LearningPathItem item) {
        return new LearningPathItemResponse(
                item.getId(),
                item.getLesson().getId(),
                item.getLesson().getTitle(),
                item.getLesson().getSlug(),
                item.getLesson().getStatus(),
                item.getDisplayOrder(),
                item.isRequired(),
                item.getWeight()
        );
    }
}
