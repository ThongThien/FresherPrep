package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.QuizSelectionMode;
import com.fesherprep.fesherprep_api.quiz.domain.QuizType;
import jakarta.validation.constraints.*;

public record UpdateQuizRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 200) String title,
        @NotNull QuizType type,
        @NotNull QuizSelectionMode selectionMode,
        @Min(0) @Max(100) int passPercentage
) {
}
