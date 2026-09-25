package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;
import com.fesherprep.fesherprep_api.quiz.domain.QuizSelectionMode;
import com.fesherprep.fesherprep_api.quiz.domain.QuizType;

import java.util.UUID;

public record PublishedQuizProjection(
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
        Long fixedQuestionCount,
        Long ruleQuestionCount
) {
}
