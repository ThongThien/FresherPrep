package com.fesherprep.fesherprep_api.knowledge.dto;

import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateKnowledgeNodeRequest(
        @NotNull NodeType type,
        UUID parentId,
        @NotBlank @Size(max = 150) String name,
        @PositiveOrZero int displayOrder
) {
}
