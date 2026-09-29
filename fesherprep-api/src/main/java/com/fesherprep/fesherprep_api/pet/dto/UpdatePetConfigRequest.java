package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record UpdatePetConfigRequest(
        @PositiveOrZero int lessonCompletionPoints,
        @PositiveOrZero int quizPassPoints,
        @PositiveOrZero int sqlPracticeCompletionPoints,
        @Positive int pointsPerFood,
        @Positive int energyPerFood
) {
}
