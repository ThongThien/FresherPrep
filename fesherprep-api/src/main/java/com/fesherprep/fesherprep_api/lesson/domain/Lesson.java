package com.fesherprep.fesherprep_api.lesson.domain;

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
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "lessons", indexes = {
        @Index(name = "idx_lessons_subtopic_order", columnList = "subtopic_id, display_order")
})
@Check(constraints = "display_order >= 0 and minimum_read_seconds > 0"
        + " and required_scroll_percent between 1 and 100")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Lesson extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subtopic_id", nullable = false)
    private KnowledgeNode subtopic;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank
    @Size(max = 220)
    @Column(nullable = false, unique = true, length = 220)
    private String slug;

    @NotBlank
    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status = ContentStatus.DRAFT;

    @PositiveOrZero
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Positive
    @Column(name = "minimum_read_seconds", nullable = false)
    private int minimumReadSeconds;

    @Min(1)
    @Max(100)
    @Column(name = "required_scroll_percent", nullable = false)
    private int requiredScrollPercent;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Lesson(KnowledgeNode subtopic, String title, String slug, String content, int displayOrder,
            int minimumReadSeconds, int requiredScrollPercent) {
        assignSubtopic(subtopic);
        updateContent(title, slug, content, displayOrder);
        configureReading(minimumReadSeconds, requiredScrollPercent);
    }

    public void assignSubtopic(KnowledgeNode subtopic) {
        if (Objects.requireNonNull(subtopic, "Subtopic is required").getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A lesson must belong to a subtopic");
        }
        this.subtopic = subtopic;
    }

    public void updateContent(String title, String slug, String content, int displayOrder) {
        if (displayOrder < 0) {
            throw new IllegalArgumentException("Display order must not be negative");
        }
        this.title = Objects.requireNonNull(title, "Title is required").strip();
        this.slug = Objects.requireNonNull(slug, "Slug is required").strip();
        this.content = Objects.requireNonNull(content, "Content is required");
        this.displayOrder = displayOrder;
    }

    public void configureReading(int minimumReadSeconds, int requiredScrollPercent) {
        if (minimumReadSeconds <= 0 || requiredScrollPercent < 1 || requiredScrollPercent > 100) {
            throw new IllegalArgumentException("Reading requires positive seconds and scroll between 1 and 100");
        }
        this.minimumReadSeconds = minimumReadSeconds;
        this.requiredScrollPercent = requiredScrollPercent;
    }

    public void changeStatus(ContentStatus status) {
        this.status = this.status.transitionTo(status);
    }
}
