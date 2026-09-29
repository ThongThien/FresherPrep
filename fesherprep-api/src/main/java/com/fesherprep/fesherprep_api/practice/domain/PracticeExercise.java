package com.fesherprep.fesherprep_api.practice.domain;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "practice_exercises", uniqueConstraints = @UniqueConstraint(
        name = "uk_practice_exercise_code", columnNames = "code"
), indexes = @Index(name = "idx_practice_language_order", columnList = "language,status,display_order"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PracticeExercise extends BaseEntity {
    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PracticeLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PracticeDifficulty difficulty;

    @Column(nullable = false, length = 200)
    private String concepts;

    @Column(name = "schema_description", nullable = false, columnDefinition = "text")
    private String schemaDescription;

    @Column(nullable = false, columnDefinition = "text")
    private String hint;

    @Column(nullable = false, columnDefinition = "text")
    private String explanation;

    @Column(name = "reference_query", nullable = false, columnDefinition = "text")
    private String referenceQuery;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status = ContentStatus.DRAFT;
}

