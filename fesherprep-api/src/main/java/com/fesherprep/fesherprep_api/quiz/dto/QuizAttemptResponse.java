package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizAttemptResponse(
        UUID id,
        UUID quizId,
        String quizTitle,
        int passPercentage,
        AttemptStatus status,
        BigDecimal scorePercentage,
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
                attempt.getStatus(),
                attempt.getScorePercentage(),
                revealResult ? attempt.isPassed() : null,
                attempt.getCreatedAt(),
                attempt.getSubmittedAt(),
                attempt.getQuestions().stream()
                        .map(question -> QuizAttemptQuestionResponse.from(question, revealResult))
                        .toList()
        );
    }
}
