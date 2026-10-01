package com.fesherprep.fesherprep_api.learningpath.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;
import java.util.UUID;

public record AddLearningPathItemsRequest(
        @NotEmpty List<@NotNull UUID> lessonIds,
        boolean required,
        @Positive int weight
) {
}
