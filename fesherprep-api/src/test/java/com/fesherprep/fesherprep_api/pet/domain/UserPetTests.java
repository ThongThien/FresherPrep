package com.fesherprep.fesherprep_api.pet.domain;

import com.fesherprep.fesherprep_api.user.domain.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class UserPetTests {
    @Test
    void convertsPointsToFoodAndKeepsRemainder() {
        UserPet pet = pet();

        pet.addLearningPoints(25, 10);

        assertEquals(25, pet.getTotalLearningPoints());
        assertEquals(2, pet.getAvailableFood());
        assertEquals(5, pet.getPointBalance());
    }

    @Test
    void feedingConsumesOneFoodAndAddsConfiguredEnergy() {
        UserPet pet = pet();
        pet.addLearningPoints(10, 10);

        pet.feed(20, 100, 3);

        assertEquals(0, pet.getAvailableFood());
        assertEquals(20, pet.getEnergy());
    }

    @Test
    void cannotUpgradeEarlyAndConsumesRequiredEnergyWhenReady() {
        UserPet pet = pet();
        pet.addLearningPoints(50, 10);
        assertThrows(IllegalStateException.class, () -> pet.upgrade(100, 3));

        for (int index = 0; index < 5; index++) pet.feed(20, 100, 3);
        pet.upgrade(100, 3);

        assertEquals(2, pet.getPetLevel());
        assertEquals(0, pet.getEnergy());
    }

    @Test
    void cannotFeedAfterUpgradeRequirementIsMet() {
        UserPet pet = pet();
        pet.addLearningPoints(20, 10);
        pet.feed(60, 100, 3);
        pet.feed(60, 100, 3);

        assertThrows(IllegalStateException.class, () -> pet.feed(60, 100, 3));
    }

    private static UserPet pet() {
        return new UserPet(new User("pet@example.com", "hashed-password", "Pet Learner"));
    }
}
