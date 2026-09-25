package com.fesherprep.fesherprep_api.lesson.dto;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record UpdateLessonRequest(
        @NotNull UUID subtopicId,
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @PositiveOrZero int displayOrder,
        @Positive int minimumReadSeconds,
        @Min(1) @Max(100) int requiredScrollPercent
) {
}
