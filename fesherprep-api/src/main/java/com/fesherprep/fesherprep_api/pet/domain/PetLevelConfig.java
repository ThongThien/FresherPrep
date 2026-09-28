package com.fesherprep.fesherprep_api.pet.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pet_level_configs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetLevelConfig {
    @Id
    @Min(1)
    @Max(3)
    private Integer level;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank
    @Size(max = 300)
    @Column(nullable = false, length = 300)
    private String description;

    @PositiveOrZero
    @Column(name = "required_energy", nullable = false)
    private int requiredEnergy;

    public void update(String name, String description, int requiredEnergy) {
        String normalizedName = normalize(name, "Pet level name", 100);
        String normalizedDescription = normalize(description, "Pet level description", 300);
        if (requiredEnergy < 0) throw new IllegalArgumentException("Required energy cannot be negative");
        this.name = normalizedName;
        this.description = normalizedDescription;
        this.requiredEnergy = requiredEnergy;
    }

    private static String normalize(String value, String field, int maximum) {
        if (value == null || value.strip().isEmpty() || value.strip().length() > maximum) {
            throw new IllegalArgumentException(field + " is required and too long");
        }
        return value.strip();
    }
}
