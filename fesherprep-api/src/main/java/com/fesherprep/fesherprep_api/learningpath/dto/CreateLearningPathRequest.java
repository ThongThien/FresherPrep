package com.fesherprep.fesherprep_api.learningpath.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateLearningPathRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank
        @Size(max = 220)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*", message = "must be a lowercase kebab-case slug")
        String slug,
        @NotNull UUID technologyId
) {
}
