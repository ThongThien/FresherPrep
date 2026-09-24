package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.quiz.domain.QuizRule;

import java.util.UUID;

public record QuizRuleResponse(
        UUID id,
        UUID knowledgeNodeId,
        Difficulty difficulty,
        int questionCount
) {
    public static QuizRuleResponse from(QuizRule rule) {
        return new QuizRuleResponse(
                rule.getId(),
                rule.getKnowledgeNode().getId(),
                rule.getDifficulty(),
                rule.getQuestionCount()
        );
    }
}
