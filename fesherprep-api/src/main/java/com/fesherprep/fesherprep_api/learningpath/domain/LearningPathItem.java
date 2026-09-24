package com.fesherprep.fesherprep_api.learningpath.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "learning_path_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_learning_path_items_lesson", columnNames = { "learning_path_id", "lesson_id" }),
        @UniqueConstraint(name = "uk_learning_path_items_order", columnNames = { "learning_path_id", "display_order" })
}, indexes = {
        @Index(name = "idx_learning_path_items_lesson", columnList = "lesson_id")
})
@Check(constraints = "display_order >= 0 and weight > 0")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LearningPathItem extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "learning_path_id", nullable = false, updatable = false)
    private LearningPath learningPath;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false, updatable = false)
    private Lesson lesson;

    @PositiveOrZero
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean required;

    @Positive
    @Column(nullable = false)
    private int weight;

    public LearningPathItem(LearningPath learningPath, Lesson lesson, int displayOrder,
            boolean required, int weight) {
        this.learningPath = Objects.requireNonNull(learningPath, "Learning path is required");
        this.lesson = Objects.requireNonNull(lesson, "Lesson is required");
        KnowledgeNode technology = lesson.getSubtopic();
        while (technology.getType() != NodeType.TECHNOLOGY) {
            technology = technology.getParent();
        }
        KnowledgeNode pathTechnology = learningPath.getTechnology();
        if (technology != pathTechnology && (technology.getId() == null
                || !technology.getId().equals(pathTechnology.getId()))) {
            throw new IllegalArgumentException("Lesson and learning path must share the same technology");
        }
        configure(displayOrder, required, weight);
    }

    public void configure(int displayOrder, boolean required, int weight) {
        if (displayOrder < 0 || weight <= 0) {
            throw new IllegalArgumentException("Display order must be nonnegative and weight positive");
        }
        this.displayOrder = displayOrder;
        this.required = required;
        this.weight = weight;
    }
}
