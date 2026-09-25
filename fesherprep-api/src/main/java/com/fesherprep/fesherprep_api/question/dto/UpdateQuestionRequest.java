package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateQuestionRequest(
        @NotNull UUID subtopicId,
        @NotNull Difficulty difficulty,
        QuestionLanguage language,
        QuestionCategory category
) {
}
