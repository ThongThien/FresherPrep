package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;

import java.util.UUID;

public record QuizKnowledgeCategoryResponse(UUID id, String name) {
    public static QuizKnowledgeCategoryResponse from(KnowledgeNode node) {
        return new QuizKnowledgeCategoryResponse(node.getId(), node.getName());
    }
}
