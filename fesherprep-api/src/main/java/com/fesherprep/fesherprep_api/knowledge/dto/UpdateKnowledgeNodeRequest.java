package com.fesherprep.fesherprep_api.knowledge.dto;

import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateKnowledgeNodeRequest(
        @NotNull NodeType type,
        UUID parentId,
        @NotBlank @Size(max = 150) String name,
        @NotBlank
        @Size(max = 180)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*",
                message = "Slug must contain lowercase letters, numbers and single hyphens")
        String slug,
        @PositiveOrZero int displayOrder
) {
}
