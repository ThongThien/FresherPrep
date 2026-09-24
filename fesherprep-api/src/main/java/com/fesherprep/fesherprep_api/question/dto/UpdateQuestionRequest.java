package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateQuestionRequest(
        @NotNull UUID subtopicId,
        @NotBlank @Size(max = 50) String code,
        @NotNull Difficulty difficulty
) {
}
