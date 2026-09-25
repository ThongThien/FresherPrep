package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.quiz.domain.QuizSelectionMode;
import com.fesherprep.fesherprep_api.quiz.domain.QuizType;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;

import java.math.BigDecimal;
import java.util.UUID;

public record PublishedQuizResponse(
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
        int questionCount
) {
    public static PublishedQuizResponse from(Quiz quiz) {
        return new PublishedQuizResponse(
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
                quiz.getSelectionMode() == QuizSelectionMode.FIXED
                        ? quiz.getFixedQuestions().size()
                        : quiz.getRules().stream().mapToInt(rule -> rule.getQuestionCount()).sum()
        );
    }

    public static PublishedQuizResponse from(PublishedQuizProjection quiz) {
        long count = quiz.selectionMode() == QuizSelectionMode.FIXED
                ? quiz.fixedQuestionCount()
                : quiz.ruleQuestionCount();
        return new PublishedQuizResponse(
                quiz.id(),
                quiz.code(),
                quiz.title(),
                quiz.type(),
                quiz.selectionMode(),
                quiz.passPercentage(),
                quiz.language(),
                quiz.category(),
                quiz.maximumScore(),
                quiz.durationSeconds(),
                BigDecimal.valueOf(quiz.maximumScore())
                        .multiply(BigDecimal.valueOf(quiz.passPercentage()))
                        .divide(BigDecimal.valueOf(100))
                        .stripTrailingZeros(),
                Math.toIntExact(count)
        );
    }
}
