package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record BatchCreateQuestionsRequest(
        @NotNull UUID subtopicId,
        QuestionLanguage language,
        QuestionCategory category,
        @NotNull @Size(min = 1, max = 50) List<@NotNull @Valid BatchQuestionItemRequest> questions
) {
}
