package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.quiz.domain.QuizSelectionMode;
import com.fesherprep.fesherprep_api.quiz.domain.QuizType;

import java.util.UUID;

public record PublishedQuizResponse(
        UUID id,
        String code,
        String title,
        QuizType type,
        QuizSelectionMode selectionMode,
        int passPercentage
) {
    public static PublishedQuizResponse from(Quiz quiz) {
        return new PublishedQuizResponse(
                quiz.getId(),
                quiz.getCode(),
                quiz.getTitle(),
                quiz.getType(),
                quiz.getSelectionMode(),
                quiz.getPassPercentage()
        );
    }
}
