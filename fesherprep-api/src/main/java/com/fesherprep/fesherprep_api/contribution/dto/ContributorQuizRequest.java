package com.fesherprep.fesherprep_api.contribution.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.*;
import jakarta.validation.constraints.*;

public record ContributorQuizRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull QuizType type,
        @NotNull QuizSelectionMode selectionMode,
        @Min(0) @Max(100) int passPercentage,
        QuestionLanguage language,
        QuizCategory category,
        @Min(1) Integer maximumScore,
        @Positive Integer durationSeconds
) {
}
