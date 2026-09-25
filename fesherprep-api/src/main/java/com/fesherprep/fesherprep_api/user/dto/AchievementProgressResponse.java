package com.fesherprep.fesherprep_api.user.dto;

public record AchievementProgressResponse(
        long completedLessons,
        long submittedQuizzes,
        long passedQuizzes
) {
}
