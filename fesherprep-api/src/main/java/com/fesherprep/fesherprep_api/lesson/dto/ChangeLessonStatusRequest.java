package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeLessonStatusRequest(@NotNull ContentStatus status) {
}
