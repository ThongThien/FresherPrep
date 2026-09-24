package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.*;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

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
                quiz.getStatus(),
                quiz.getCreatedAt(),
                quiz.getUpdatedAt(),
                quiz.getFixedQuestions().stream().map(QuizFixedQuestionResponse::from).toList(),
                quiz.getRules().stream().map(QuizRuleResponse::from).toList()
        );
    }
}
