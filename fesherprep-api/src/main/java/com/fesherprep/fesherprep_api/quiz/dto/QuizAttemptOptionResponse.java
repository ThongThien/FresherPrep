package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionOption;

import java.util.UUID;

public record QuizAttemptOptionResponse(
        UUID id,
        int position,
        String content,
        Boolean correct,
        String explanation
) {
    public static QuizAttemptOptionResponse from(QuestionOption option, boolean revealResult) {
        return new QuizAttemptOptionResponse(
                option.getId(),
                option.getPosition(),
                option.getContent(),
                revealResult ? option.isCorrect() : null,
                revealResult ? option.getExplanation() : null
        );
    }
}
