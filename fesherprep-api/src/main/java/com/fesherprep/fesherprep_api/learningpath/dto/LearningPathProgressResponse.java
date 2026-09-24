package com.fesherprep.fesherprep_api.learningpath.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record LearningPathProgressResponse(
        UUID learningPathId,
        String learningPathName,
        int totalItems,
        int completedItems,
        int requiredItems,
        int completedRequiredItems,
        long totalRequiredWeight,
        long completedRequiredWeight,
        BigDecimal progressPercentage,
        boolean completed,
        List<LearningPathLessonProgressResponse> lessons
) {
    public LearningPathProgressResponse {
        lessons = List.copyOf(lessons);
    }
}
