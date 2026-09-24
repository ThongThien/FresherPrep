package com.fesherprep.fesherprep_api.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SubmitQuizAttemptRequest(
        @NotNull List<@Valid SubmitQuizAnswerRequest> answers
) {
}
