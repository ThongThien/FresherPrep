package com.fesherprep.fesherprep_api.pet.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Entity
@Table(name = "pets", uniqueConstraints = @UniqueConstraint(name = "uk_pet_code", columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Pet extends BaseEntity {
    @Column(nullable = false, length = 60)
    private String code;
    @Column(name = "name_vi", nullable = false, length = 100)
    private String nameVi;
    @Column(name = "name_en", nullable = false, length = 100)
    private String nameEn;
    @Column(name = "description_vi", nullable = false, length = 500)
    private String descriptionVi;
    @Column(name = "description_en", nullable = false, length = 500)
    private String descriptionEn;
    @Column(name = "learning_meaning_vi", nullable = false, length = 500)
    private String learningMeaningVi;
    @Column(name = "learning_meaning_en", nullable = false, length = 500)
    private String learningMeaningEn;
    @Column(nullable = false)
    private boolean active;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Version
    @Column(nullable = false)
    private long version;
    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("levelOrder ASC")
    private List<PetLevelConfig> levels = new ArrayList<>();

    public Pet(String code, String nameVi, String nameEn, String descriptionVi, String descriptionEn,
               String learningMeaningVi, String learningMeaningEn, boolean active, int displayOrder) {
        update(code, nameVi, nameEn, descriptionVi, descriptionEn, learningMeaningVi, learningMeaningEn,
                active, displayOrder);
    }

    public void update(String code, String nameVi, String nameEn, String descriptionVi, String descriptionEn,
                       String learningMeaningVi, String learningMeaningEn, boolean active, int displayOrder) {
        this.code = normalizeCode(code);
        this.nameVi = text(nameVi, "Vietnamese name", 100);
        this.nameEn = text(nameEn, "English name", 100);
        this.descriptionVi = text(descriptionVi, "Vietnamese description", 500);
        this.descriptionEn = text(descriptionEn, "English description", 500);
        this.learningMeaningVi = text(learningMeaningVi, "Vietnamese learning meaning", 500);
        this.learningMeaningEn = text(learningMeaningEn, "English learning meaning", 500);
        if (displayOrder < 0) throw new IllegalArgumentException("Display order cannot be negative");
        this.active = active;
        this.displayOrder = displayOrder;
    }

    public void replaceLevels(List<PetLevelConfig> replacement) {
        while (levels.size() > replacement.size()) {
            levels.removeLast();
        }
        for (int index = 0; index < replacement.size(); index++) {
            PetLevelConfig source = replacement.get(index);
            if (index < levels.size()) {
                levels.get(index).update(
                        source.getLevelOrder(), source.getNameVi(), source.getNameEn(),
                        source.getDescriptionVi(), source.getDescriptionEn(),
                        source.getRequiredEnergy(), source.getAssetReference()
                );
            } else {
                levels.add(source);
            }
        }
    }

    private static String normalizeCode(String value) {
        String code = text(value, "Pet code", 60).toUpperCase(Locale.ROOT);
        if (!code.matches("[A-Z0-9_-]+")) throw new IllegalArgumentException("Pet code is invalid");
        return code;
    }

    private static String text(String value, String field, int max) {
        if (value == null || value.strip().isEmpty() || value.strip().length() > max) {
            throw new IllegalArgumentException(field + " is required and must not exceed " + max + " characters");
        }
        return value.strip();
    }
}
