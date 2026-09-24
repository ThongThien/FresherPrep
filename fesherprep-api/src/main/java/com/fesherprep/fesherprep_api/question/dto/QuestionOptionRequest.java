package com.fesherprep.fesherprep_api.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record QuestionOptionRequest(
        @Min(1) @Max(4) int position,
        @NotBlank String content,
        boolean correct,
        @NotBlank String explanation
) {
}
