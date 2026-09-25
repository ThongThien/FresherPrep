package com.fesherprep.fesherprep_api.user.dto;

import java.util.List;

public record AdminUserDetailResponse(
        AdminUserSummaryResponse account,
        long joinedLearningPaths,
        long trackedLessons,
        long readingQualifiedLessons,
        long quizAttempts,
        long submittedQuizAttempts,
        long passedQuizAttempts,
        long failedQuizAttempts,
        List<AdminLessonActivityResponse> recentLessons,
        List<AdminQuizActivityResponse> recentQuizAttempts
) {
}
