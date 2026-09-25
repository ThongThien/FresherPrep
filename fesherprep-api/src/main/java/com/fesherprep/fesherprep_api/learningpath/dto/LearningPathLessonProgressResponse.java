package com.fesherprep.fesherprep_api.learningpath.dto;

import com.fesherprep.fesherprep_api.lesson.dto.AssessmentProgressStatus;

import java.util.UUID;

public record LearningPathLessonProgressResponse(
        UUID itemId,
        UUID lessonId,
        String lessonTitle,
        int displayOrder,
        boolean required,
        int weight,
        boolean readingQualified,
        boolean assessmentRequired,
        UUID assessmentQuizId,
        AssessmentProgressStatus assessmentStatus,
        boolean completed,
        boolean locked,
        UUID blockedByLessonId,
        String blockedByLessonTitle
) {
}
