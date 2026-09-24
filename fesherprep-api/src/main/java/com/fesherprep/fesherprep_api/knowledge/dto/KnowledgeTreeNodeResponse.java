package com.fesherprep.fesherprep_api.knowledge.dto;

import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;

import java.util.List;
import java.util.UUID;

public record KnowledgeTreeNodeResponse(
        UUID id,
        NodeType type,
        String name,
        String slug,
        int displayOrder,
        List<KnowledgeTreeNodeResponse> children
) {
    public KnowledgeTreeNodeResponse {
        children = List.copyOf(children);
    }
}
