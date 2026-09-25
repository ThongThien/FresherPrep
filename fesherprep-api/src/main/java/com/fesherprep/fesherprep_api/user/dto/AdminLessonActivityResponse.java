package com.fesherprep.fesherprep_api.user.dto;

import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;

import java.time.Instant;
import java.util.UUID;

public record AdminLessonActivityResponse(
        UUID lessonId,
        String lessonTitle,
        long activeSeconds,
        int maxScrollPercent,
        boolean readingQualified,
        Instant lastViewedAt
) {
    public static AdminLessonActivityResponse from(LessonProgress progress) {
        return new AdminLessonActivityResponse(
                progress.getLesson().getId(),
                progress.getLesson().getTitle(),
                progress.getActiveSeconds(),
                progress.getMaxScrollPercent(),
                progress.getReadQualifiedAt() != null,
                progress.getLastViewedAt()
        );
    }
}
