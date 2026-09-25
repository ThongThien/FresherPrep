package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record QuizAttemptSummaryResponse(
        UUID id,
        UUID quizId,
        String quizTitle,
        QuestionLanguage language,
        QuizCategory category,
        AttemptStatus status,
        BigDecimal scorePercentage,
        BigDecimal score,
        int maximumScore,
        Integer durationSeconds,
        Instant expiresAt,
        Boolean passed,
        Instant startedAt,
        Instant submittedAt
) {
    public static QuizAttemptSummaryResponse from(QuizAttempt attempt) {
        boolean submitted = attempt.getStatus() == AttemptStatus.SUBMITTED;
        return new QuizAttemptSummaryResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuizTitle(),
                attempt.getLanguage(),
                attempt.getCategory(),
                attempt.getStatus(),
                attempt.getScorePercentage(),
                attempt.getScore(),
                attempt.getMaximumScore(),
                attempt.getDurationSeconds(),
                attempt.getExpiresAt(),
                submitted ? attempt.isPassed() : null,
                attempt.getCreatedAt(),
                attempt.getSubmittedAt()
        );
    }
}
