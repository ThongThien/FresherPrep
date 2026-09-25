package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.QuizSelectionMode;
import com.fesherprep.fesherprep_api.quiz.domain.QuizType;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;
import jakarta.validation.constraints.*;

public record CreateQuizRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 200) String title,
        @NotNull QuizType type,
        @NotNull QuizSelectionMode selectionMode,
        @Min(0) @Max(100) int passPercentage,
        QuestionLanguage language,
        QuizCategory category,
        @Min(1) Integer maximumScore
) {
}
