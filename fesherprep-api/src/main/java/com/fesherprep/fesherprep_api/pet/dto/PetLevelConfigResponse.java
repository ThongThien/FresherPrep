package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.PetLevelConfig;

public record PetLevelConfigResponse(
        int level,
        LocalizedPetText name,
        LocalizedPetText description,
        int requiredEnergy,
        String assetReference
) {
    public static PetLevelConfigResponse from(PetLevelConfig config) {
        return new PetLevelConfigResponse(
                config.getLevelOrder(),
                new LocalizedPetText(config.getNameVi(), config.getNameEn()),
                new LocalizedPetText(config.getDescriptionVi(), config.getDescriptionEn()),
                config.getRequiredEnergy(), config.getAssetReference()
        );
    }
}
