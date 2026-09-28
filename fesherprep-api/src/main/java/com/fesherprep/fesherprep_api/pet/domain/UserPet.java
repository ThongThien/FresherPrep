package com.fesherprep.fesherprep_api.pet.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "user_pets", uniqueConstraints =
        @UniqueConstraint(name = "uk_user_pet_user", columnNames = "user_id"))
@Check(constraints = "total_learning_points >= 0 and point_balance >= 0 and available_food >= 0 and energy >= 0 and pet_level between 1 and 3")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPet extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @PositiveOrZero
    @Column(name = "total_learning_points", nullable = false)
    private long totalLearningPoints;

    @PositiveOrZero
    @Column(name = "point_balance", nullable = false)
    private int pointBalance;

    @PositiveOrZero
    @Column(name = "available_food", nullable = false)
    private int availableFood;

    @PositiveOrZero
    @Column(nullable = false)
    private int energy;

    @Min(1)
    @Max(3)
    @Column(name = "pet_level", nullable = false)
    private int petLevel = 1;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public UserPet(User user) {
        this.user = Objects.requireNonNull(user, "User is required");
    }

    public void addLearningPoints(int points, int pointsPerFood) {
        if (points < 0 || pointsPerFood < 1) throw new IllegalArgumentException("Invalid point conversion");
        totalLearningPoints = Math.addExact(totalLearningPoints, points);
        pointBalance = Math.addExact(pointBalance, points);
        availableFood = Math.addExact(availableFood, pointBalance / pointsPerFood);
        pointBalance %= pointsPerFood;
    }

    public void feed(int energyPerFood, int requiredEnergy, int maximumLevel) {
        if (petLevel >= maximumLevel) throw new IllegalStateException("Pet is already at the maximum level");
        if (availableFood < 1) throw new IllegalStateException("No Food is available");
        if (requiredEnergy < 1) throw new IllegalStateException("Pet level configuration is invalid");
        if (energy >= requiredEnergy) throw new IllegalStateException("Upgrade the Pet before feeding again");
        availableFood--;
        energy = Math.addExact(energy, energyPerFood);
    }

    public void upgrade(int requiredEnergy, int maximumLevel) {
        if (petLevel >= maximumLevel) throw new IllegalStateException("Pet is already at the maximum level");
        if (requiredEnergy < 1 || energy < requiredEnergy) {
            throw new IllegalStateException("Pet does not have enough Energy to upgrade");
        }
        energy -= requiredEnergy;
        petLevel++;
    }
}
