package com.fesherprep.fesherprep_api.learningpath.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateLearningPathItemRequest(
        @PositiveOrZero int displayOrder,
        boolean required,
        @Positive int weight
) {
}
