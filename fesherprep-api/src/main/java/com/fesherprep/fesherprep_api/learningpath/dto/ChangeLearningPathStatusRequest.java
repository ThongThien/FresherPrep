package com.fesherprep.fesherprep_api.learningpath.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeLearningPathStatusRequest(@NotNull ContentStatus status) {
}
