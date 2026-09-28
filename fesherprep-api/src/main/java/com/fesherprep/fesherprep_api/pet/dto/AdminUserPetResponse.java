package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.UserPet;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.domain.UserRole;

import java.time.Instant;
import java.util.UUID;

public record AdminUserPetResponse(
        UUID petId,
        UUID userId,
        String email,
        String displayName,
        UserRole role,
        boolean active,
        long totalLearningPoints,
        int pointBalance,
        int availableFood,
        int energy,
        int currentLevel,
        Instant updatedAt
) {
    public static AdminUserPetResponse from(UserPet pet) {
        User user = pet.getUser();
        return new AdminUserPetResponse(
                pet.getId(),
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.isActive(),
                pet.getTotalLearningPoints(),
                pet.getPointBalance(),
                pet.getAvailableFood(),
                pet.getEnergy(),
                pet.getPetLevel(),
                pet.getUpdatedAt()
        );
    }
}
