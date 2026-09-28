package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.*;

public record PetStateResponse(
        long totalLearningPoints,
        int pointBalance,
        int pointsPerFood,
        int availableFood,
        int energy,
        int energyPerFood,
        int currentLevel,
        int maximumLevel,
        String name,
        String description,
        int requiredEnergy,
        boolean canFeed,
        boolean canUpgrade
) {
    public static PetStateResponse from(UserPet pet, PetSettings settings, PetLevelConfig level) {
        boolean maximum = pet.getPetLevel() >= settings.getMaxLevel();
        int required = maximum ? 0 : level.getRequiredEnergy();
        return new PetStateResponse(
                pet.getTotalLearningPoints(), pet.getPointBalance(), settings.getPointsPerFood(),
                pet.getAvailableFood(), pet.getEnergy(), settings.getEnergyPerFood(),
                pet.getPetLevel(), settings.getMaxLevel(), level.getName(), level.getDescription(),
                required,
                !maximum && pet.getAvailableFood() > 0 && pet.getEnergy() < required,
                !maximum && required > 0 && pet.getEnergy() >= required
        );
    }
}
