package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record UpdatePetConfigRequest(
        @PositiveOrZero int lessonCompletionPoints,
        @PositiveOrZero int quizPassPoints,
        @Positive int pointsPerFood,
        @Positive int energyPerFood,
        @Min(1) @Max(3) int maximumLevel,
        @NotNull @Size(min = 3, max = 3) List<@Valid PetLevelConfigRequest> levels
) {
}
