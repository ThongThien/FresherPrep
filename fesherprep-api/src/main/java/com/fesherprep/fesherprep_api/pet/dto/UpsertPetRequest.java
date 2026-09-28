package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record UpsertPetRequest(
        @NotBlank @Size(max = 60) String code,
        @NotNull @Valid LocalizedPetText name,
        @NotNull @Valid LocalizedPetText description,
        @NotNull @Valid LocalizedPetText learningMeaning,
        boolean active,
        @PositiveOrZero int displayOrder,
        @NotNull @Size(min = 1, max = 50) List<@Valid PetLevelConfigRequest> levels
) {}
