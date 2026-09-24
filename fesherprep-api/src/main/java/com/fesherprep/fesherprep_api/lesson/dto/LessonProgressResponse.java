package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;

import java.time.Instant;
import java.util.UUID;

public record LessonProgressResponse(
        UUID lessonId,
        String lessonTitle,
        long activeSeconds,
        int maxScrollPercent,
        Instant lastViewedAt,
        boolean readQualified,
        Instant readQualifiedAt,
        boolean assessmentRequired,
        UUID assessmentQuizId,
        AssessmentProgressStatus assessmentStatus,
        boolean completed,
        long version
) {
    public static LessonProgressResponse from(
            LessonProgress progress,
            boolean assessmentRequired,
            UUID assessmentQuizId,
            AssessmentProgressStatus assessmentStatus,
            boolean completed
    ) {
        return new LessonProgressResponse(
                progress.getLesson().getId(),
                progress.getLesson().getTitle(),
                progress.getActiveSeconds(),
                progress.getMaxScrollPercent(),
                progress.getLastViewedAt(),
                progress.getReadQualifiedAt() != null,
                progress.getReadQualifiedAt(),
                assessmentRequired,
                assessmentQuizId,
                assessmentStatus,
                completed,
                progress.getVersion()
        );
    }
}
