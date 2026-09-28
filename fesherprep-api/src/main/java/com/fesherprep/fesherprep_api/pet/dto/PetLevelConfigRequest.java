package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.constraints.*;

public record PetLevelConfigRequest(
        @Min(1) @Max(3) int level,
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 300) String description,
        @PositiveOrZero int requiredEnergy
) {
}
