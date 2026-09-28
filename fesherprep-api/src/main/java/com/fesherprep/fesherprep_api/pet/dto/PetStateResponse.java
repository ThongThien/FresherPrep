package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.*;

public record PetStateResponse(
        java.util.UUID progressionId,
        java.util.UUID petId,
        String petCode,
        long totalLearningPoints,
        int pointBalance,
        int pointsPerFood,
        int availableFood,
        int energy,
        int energyPerFood,
        int currentLevel,
        int maximumLevel,
        LocalizedPetText petName,
        LocalizedPetText petDescription,
        LocalizedPetText learningMeaning,
        LocalizedPetText levelName,
        LocalizedPetText levelDescription,
        String assetReference,
        int requiredEnergy,
        boolean canFeed,
        boolean canUpgrade,
        boolean completed
) {
    public static PetStateResponse from(UserPet progress, PetSettings settings, PetLevelConfig level, int maximumLevel) {
        boolean completed = progress.getStatus() == UserPetStatus.COMPLETED;
        int required = completed ? 0 : level.getRequiredEnergy();
        Pet pet = progress.getPet();
        return new PetStateResponse(
                progress.getId(), pet.getId(), pet.getCode(),
                progress.getTotalLearningPoints(), progress.getPointBalance(), settings.getPointsPerFood(),
                progress.getAvailableFood(), progress.getEnergy(), settings.getEnergyPerFood(),
                progress.getPetLevel(), maximumLevel,
                new LocalizedPetText(pet.getNameVi(), pet.getNameEn()),
                new LocalizedPetText(pet.getDescriptionVi(), pet.getDescriptionEn()),
                new LocalizedPetText(pet.getLearningMeaningVi(), pet.getLearningMeaningEn()),
                new LocalizedPetText(level.getNameVi(), level.getNameEn()),
                new LocalizedPetText(level.getDescriptionVi(), level.getDescriptionEn()),
                level.getAssetReference(),
                required,
                !completed && progress.getAvailableFood() > 0 && progress.getEnergy() < required,
                !completed && required > 0 && progress.getEnergy() >= required,
                completed
        );
    }
}
