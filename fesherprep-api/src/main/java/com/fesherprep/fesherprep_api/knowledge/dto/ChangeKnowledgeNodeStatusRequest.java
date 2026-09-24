package com.fesherprep.fesherprep_api.knowledge.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeKnowledgeNodeStatusRequest(@NotNull ContentStatus status) {
}
