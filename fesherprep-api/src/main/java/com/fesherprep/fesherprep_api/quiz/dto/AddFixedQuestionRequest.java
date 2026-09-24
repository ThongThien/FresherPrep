package com.fesherprep.fesherprep_api.quiz.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record AddFixedQuestionRequest(
        @NotNull UUID questionId,
        @Positive int position
) {
}
