package com.fesherprep.fesherprep_api.pet.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "pet_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetSettings {
    public static final short SINGLETON_ID = 1;

    @Id
    private Short id = SINGLETON_ID;

    @PositiveOrZero
    @Column(name = "lesson_completion_points", nullable = false)
    private int lessonCompletionPoints;

    @PositiveOrZero
    @Column(name = "quiz_pass_points", nullable = false)
    private int quizPassPoints;

    @Positive
    @Column(name = "points_per_food", nullable = false)
    private int pointsPerFood;

    @Positive
    @Column(name = "energy_per_food", nullable = false)
    private int energyPerFood;

    @Min(1)
    @Max(3)
    @Column(name = "max_level", nullable = false)
    private int maxLevel;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public void update(
            int lessonCompletionPoints,
            int quizPassPoints,
            int pointsPerFood,
            int energyPerFood,
            int maxLevel
    ) {
        if (lessonCompletionPoints < 0 || quizPassPoints < 0) {
            throw new IllegalArgumentException("Activity points cannot be negative");
        }
        if (pointsPerFood < 1 || energyPerFood < 1) {
            throw new IllegalArgumentException("Food conversion values must be positive");
        }
        if (maxLevel < 1 || maxLevel > 3) {
            throw new IllegalArgumentException("Maximum pet level must be between 1 and 3");
        }
        this.lessonCompletionPoints = lessonCompletionPoints;
        this.quizPassPoints = quizPassPoints;
        this.pointsPerFood = pointsPerFood;
        this.energyPerFood = energyPerFood;
        this.maxLevel = maxLevel;
    }
}
