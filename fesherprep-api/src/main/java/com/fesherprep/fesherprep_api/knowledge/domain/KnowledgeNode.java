package com.fesherprep.fesherprep_api.knowledge.domain;

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
@Table(name = "knowledge_nodes", indexes = {
        @Index(name = "idx_knowledge_nodes_parent_order", columnList = "parent_id, display_order")
})
@Check(constraints = "display_order >= 0 and ((node_type = 'TECHNOLOGY' and parent_id is null)"
        + " or (node_type <> 'TECHNOLOGY' and parent_id is not null))")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KnowledgeNode extends BaseEntity {

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", nullable = false, length = 20)
    private NodeType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private KnowledgeNode parent;

    @NotBlank
    @Size(max = 150)
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank
    @Size(max = 180)
    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @PositiveOrZero
    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status = ContentStatus.DRAFT;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public KnowledgeNode(NodeType type, String name, String slug, KnowledgeNode parent, int displayOrder) {
        changePlacement(type, parent);
        updateDetails(name, slug, displayOrder);
    }

    public void updateDetails(String name, String slug, int displayOrder) {
        if (displayOrder < 0) {
            throw new IllegalArgumentException("Display order must not be negative");
        }
        this.name = Objects.requireNonNull(name, "Name is required").strip();
        this.slug = Objects.requireNonNull(slug, "Slug is required").strip();
        this.displayOrder = displayOrder;
    }

    public void moveTo(KnowledgeNode parent) {
        changePlacement(type, parent);
    }

    public void changePlacement(NodeType type, KnowledgeNode parent) {
        Objects.requireNonNull(type, "Node type is required");
        if (hasSameIdentityAs(parent)) {
            throw new IllegalArgumentException("A knowledge node cannot be its own parent");
        }
        // Earlier parent types allow skipped levels while preventing cycles in the
        // tree.
        if (type == NodeType.TECHNOLOGY ? parent != null
                : parent == null || !parent.getType().canParent(type)) {
            throw new IllegalArgumentException(
                    "Parent must be an earlier type in Technology -> Category -> Topic -> Subtopic");
        }
        this.type = type;
        this.parent = parent;
    }

    public void changeStatus(ContentStatus status) {
        this.status = this.status.transitionTo(status);
    }
}
