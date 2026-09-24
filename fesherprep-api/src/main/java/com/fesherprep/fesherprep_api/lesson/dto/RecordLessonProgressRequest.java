package com.fesherprep.fesherprep_api.lesson.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

public record RecordLessonProgressRequest(
        @PositiveOrZero long activeSeconds,
        @Min(0) @Max(100) int scrollPercent
) {
}
