package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.QuizFixedQuestion;

import java.util.UUID;

public record QuizFixedQuestionResponse(
        UUID id,
        UUID questionId,
        String questionCode,
        int position
) {
    public static QuizFixedQuestionResponse from(QuizFixedQuestion item) {
        return new QuizFixedQuestionResponse(
                item.getId(),
                item.getQuestion().getId(),
                item.getQuestion().getCode(),
                item.getPosition()
        );
    }
}
