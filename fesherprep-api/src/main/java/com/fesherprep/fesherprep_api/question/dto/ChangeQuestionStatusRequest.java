package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeQuestionStatusRequest(@NotNull ContentStatus status) {
}
