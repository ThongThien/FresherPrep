package com.fesherprep.fesherprep_api.user.dto;

import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminQuizActivityResponse(
        UUID attemptId,
        UUID quizId,
        String quizTitle,
        AttemptStatus status,
        BigDecimal scorePercentage,
        Boolean passed,
        Instant startedAt,
        Instant submittedAt
) {
    public static AdminQuizActivityResponse from(QuizAttempt attempt) {
        boolean submitted = attempt.getStatus() == AttemptStatus.SUBMITTED;
        return new AdminQuizActivityResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuizTitle(),
                attempt.getStatus(),
                attempt.getScorePercentage(),
                submitted ? attempt.isPassed() : null,
                attempt.getCreatedAt(),
                attempt.getSubmittedAt()
        );
    }
}
