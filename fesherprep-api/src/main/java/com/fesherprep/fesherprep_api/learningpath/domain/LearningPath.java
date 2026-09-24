package com.fesherprep.fesherprep_api.learningpath.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "learning_paths", indexes = {
        @Index(name = "idx_learning_paths_technology", columnList = "technology_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LearningPath extends BaseEntity {

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String name;

    @NotBlank
    @Size(max = 220)
    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "technology_id", nullable = false, updatable = false)
    private KnowledgeNode technology;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status = ContentStatus.DRAFT;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public LearningPath(String name, String slug, KnowledgeNode technology) {
        if (Objects.requireNonNull(technology, "Technology is required").getType() != NodeType.TECHNOLOGY) {
            throw new IllegalArgumentException("Learning paths must belong to a technology node");
        }
        this.technology = technology;
        rename(name, slug);
    }

    public void rename(String name, String slug) {
        this.name = Objects.requireNonNull(name, "Name is required").strip();
        this.slug = Objects.requireNonNull(slug, "Slug is required").strip();
    }

    public void changeStatus(ContentStatus status) {
        this.status = this.status.transitionTo(status);
    }
}
