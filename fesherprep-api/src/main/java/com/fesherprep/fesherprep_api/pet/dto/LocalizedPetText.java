package com.fesherprep.fesherprep_api.pet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LocalizedPetText(
        @NotBlank @Size(max = 500) String vi,
        @NotBlank @Size(max = 500) String en
) {}
