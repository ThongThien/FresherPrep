package com.fesherprep.fesherprep_api.question.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record QuestionOptionRequest(
        @Min(1) @Max(4) int position,
        @NotBlank @Size(max = 2000) String content,
        boolean correct,
        @NotBlank @Size(max = 4000) String explanation
) {
}
