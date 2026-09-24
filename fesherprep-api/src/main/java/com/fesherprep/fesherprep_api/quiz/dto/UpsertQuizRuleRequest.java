package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record UpsertQuizRuleRequest(
        @NotNull UUID knowledgeNodeId,
        Difficulty difficulty,
        @Positive int questionCount
) {
}
