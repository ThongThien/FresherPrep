package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.PetLevelConfig;

public record PetLevelConfigResponse(
        int level,
        String name,
        String description,
        int requiredEnergy
) {
    public static PetLevelConfigResponse from(PetLevelConfig config) {
        return new PetLevelConfigResponse(
                config.getLevel(), config.getName(), config.getDescription(), config.getRequiredEnergy()
        );
    }
}
