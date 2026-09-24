package com.fesherprep.fesherprep_api.quiz.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SubmitQuizAnswerRequest(
        @NotNull UUID attemptQuestionId,
        @NotNull UUID optionId
) {
}
