package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizAttemptResponse(
        UUID id,
        UUID quizId,
        String quizTitle,
        int passPercentage,
        QuestionLanguage language,
        QuizCategory category,
        int maximumScore,
        Integer durationSeconds,
        Instant expiresAt,
        BigDecimal passingScore,
        AttemptStatus status,
        BigDecimal scorePercentage,
        BigDecimal score,
        Boolean passed,
        Instant startedAt,
        Instant submittedAt,
        List<QuizAttemptQuestionResponse> questions
) {
    public static QuizAttemptResponse from(QuizAttempt attempt) {
        boolean revealResult = attempt.getStatus() == AttemptStatus.SUBMITTED;
        return new QuizAttemptResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuizTitle(),
                attempt.getPassPercentage(),
                attempt.getLanguage(),
                attempt.getCategory(),
                attempt.getMaximumScore(),
                attempt.getDurationSeconds(),
                attempt.getExpiresAt(),
                attempt.getPassingScore(),
                attempt.getStatus(),
                attempt.getScorePercentage(),
                attempt.getScore(),
                revealResult ? attempt.isPassed() : null,
                attempt.getCreatedAt(),
                attempt.getSubmittedAt(),
                attempt.getQuestions().stream()
                        .map(question -> QuizAttemptQuestionResponse.from(question, revealResult))
                        .toList()
        );
    }
}
