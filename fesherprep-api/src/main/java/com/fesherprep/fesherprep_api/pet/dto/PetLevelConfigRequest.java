package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;

public record PetLevelConfigRequest(
        @Min(1) int level,
        @NotNull @Valid LocalizedPetText name,
        @NotNull @Valid LocalizedPetText description,
        @PositiveOrZero int requiredEnergy,
        @NotBlank @Size(max = 255) String assetReference
) {
}
