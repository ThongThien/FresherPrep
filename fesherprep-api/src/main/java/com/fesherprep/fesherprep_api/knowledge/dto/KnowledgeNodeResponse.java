package com.fesherprep.fesherprep_api.knowledge.dto;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.time.Instant;
import java.util.UUID;

public record KnowledgeNodeResponse(
        UUID id,
        UUID parentId,
        NodeType type,
        String name,
        String slug,
        int displayOrder,
        ContentStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static KnowledgeNodeResponse from(KnowledgeNode node) {
        return new KnowledgeNodeResponse(
                node.getId(),
                node.getParent() == null ? null : node.getParent().getId(),
                node.getType(),
                node.getName(),
                node.getSlug(),
                node.getDisplayOrder(),
                node.getStatus(),
                node.getCreatedAt(),
                node.getUpdatedAt()
        );
    }
}
