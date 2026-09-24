package com.fesherprep.fesherprep_api.question.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateQuestionVersionRequest(
        @NotBlank String content,
        @NotBlank String explanation,
        @NotNull @Size(min = 4, max = 4) List<@NotNull @Valid QuestionOptionRequest> options
) {
}
