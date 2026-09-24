package com.fesherprep.fesherprep_api.learningpath.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.UUID;

public record AddLearningPathItemRequest(
        @NotNull UUID lessonId,
        @PositiveOrZero int displayOrder,
        boolean required,
        @Positive int weight
) {
}
