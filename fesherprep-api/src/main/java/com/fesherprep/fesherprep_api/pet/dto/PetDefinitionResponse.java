package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.Pet;
import java.util.*;

public record PetDefinitionResponse(
        UUID id, String code, LocalizedPetText name, LocalizedPetText description,
        LocalizedPetText learningMeaning, boolean active, int displayOrder,
        List<PetLevelConfigResponse> levels
) {
    public static PetDefinitionResponse from(Pet pet) {
        return new PetDefinitionResponse(
                pet.getId(), pet.getCode(),
                new LocalizedPetText(pet.getNameVi(), pet.getNameEn()),
                new LocalizedPetText(pet.getDescriptionVi(), pet.getDescriptionEn()),
                new LocalizedPetText(pet.getLearningMeaningVi(), pet.getLearningMeaningEn()),
                pet.isActive(), pet.getDisplayOrder(),
                pet.getLevels().stream().map(PetLevelConfigResponse::from).toList()
        );
    }
}
