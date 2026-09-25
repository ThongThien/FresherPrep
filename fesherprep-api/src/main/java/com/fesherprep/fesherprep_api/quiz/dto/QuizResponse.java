package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.*;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizResponse(
        UUID id,
        String code,
        String title,
        QuizType type,
        QuizSelectionMode selectionMode,
        int passPercentage,
        QuestionLanguage language,
        QuizCategory category,
        int maximumScore,
        Integer durationSeconds,
        BigDecimal passingScore,
        ContentStatus status,
        Instant createdAt,
        Instant updatedAt,
        List<QuizFixedQuestionResponse> fixedQuestions,
        List<QuizRuleResponse> rules
) {
    public static QuizResponse from(Quiz quiz) {
        return new QuizResponse(
                quiz.getId(),
                quiz.getCode(),
                quiz.getTitle(),
                quiz.getType(),
                quiz.getSelectionMode(),
                quiz.getPassPercentage(),
                quiz.getLanguage(),
                quiz.getCategory(),
                quiz.getMaximumScore(),
                quiz.getDurationSeconds(),
                BigDecimal.valueOf(quiz.getMaximumScore())
                        .multiply(BigDecimal.valueOf(quiz.getPassPercentage()))
                        .divide(BigDecimal.valueOf(100))
                        .stripTrailingZeros(),
                quiz.getStatus(),
                quiz.getCreatedAt(),
                quiz.getUpdatedAt(),
                quiz.getFixedQuestions().stream().map(QuizFixedQuestionResponse::from).toList(),
                quiz.getRules().stream().map(QuizRuleResponse::from).toList()
        );
    }
}
