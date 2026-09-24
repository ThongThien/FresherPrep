package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeQuizStatusRequest(@NotNull ContentStatus status) {
}
