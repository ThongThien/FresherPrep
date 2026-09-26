package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BatchQuestionItemRequest(
        @NotNull Difficulty difficulty,
        @NotBlank @Size(max = 10000) String content,
        @NotBlank @Size(max = 20000) String explanation,
        @NotNull @Size(min = 4, max = 4) List<@NotNull @Valid QuestionOptionRequest> options
) {
}
