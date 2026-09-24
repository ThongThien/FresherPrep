package com.fesherprep.fesherprep_api.lesson.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignLessonAssessmentRequest(@NotNull UUID quizId) {
}
