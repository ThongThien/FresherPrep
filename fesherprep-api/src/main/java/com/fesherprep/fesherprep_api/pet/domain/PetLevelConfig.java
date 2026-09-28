package com.fesherprep.fesherprep_api.pet.domain;

import jakarta.persistence.*;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pet_level_configs", uniqueConstraints =
        @UniqueConstraint(name = "uk_pet_level_order", columnNames = {"pet_id", "level_order"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PetLevelConfig extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false, updatable = false)
    private Pet pet;

    @Positive
    @Column(name = "level_order", nullable = false)
    private int levelOrder;

    @Column(name = "name_vi", nullable = false, length = 100)
    private String nameVi;
    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;
    @Column(name = "description_vi", nullable = false, length = 300)
    private String descriptionVi;
    @Column(name = "description_en", nullable = false, length = 300)
    private String descriptionEn;
    @Column(name = "asset_reference", nullable = false, length = 255)
    private String assetReference;

    @PositiveOrZero
    @Column(name = "required_energy", nullable = false)
    private int requiredEnergy;

    public PetLevelConfig(Pet pet, int levelOrder, String nameVi, String nameEn, String descriptionVi,
                          String descriptionEn, int requiredEnergy, String assetReference) {
        this.pet = java.util.Objects.requireNonNull(pet, "Pet is required");
        update(levelOrder, nameVi, nameEn, descriptionVi, descriptionEn, requiredEnergy, assetReference);
    }

    public void update(int levelOrder, String nameVi, String nameEn, String descriptionVi,
                       String descriptionEn, int requiredEnergy, String assetReference) {
        if (levelOrder < 1) throw new IllegalArgumentException("Pet level must be positive");
        if (requiredEnergy < 0) throw new IllegalArgumentException("Required energy cannot be negative");
        this.levelOrder = levelOrder;
        this.nameVi = normalize(nameVi, "Vietnamese level name", 100);
        this.nameEn = normalize(nameEn, "English level name", 100);
        this.descriptionVi = normalize(descriptionVi, "Vietnamese level description", 300);
        this.descriptionEn = normalize(descriptionEn, "English level description", 300);
        this.requiredEnergy = requiredEnergy;
        this.assetReference = normalize(assetReference, "Asset reference", 255);
    }

    private static String normalize(String value, String field, int maximum) {
        if (value == null || value.strip().isEmpty() || value.strip().length() > maximum) {
            throw new IllegalArgumentException(field + " is required and too long");
        }
        return value.strip();
    }
}
