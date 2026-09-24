package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.QuestionOption;

import java.util.UUID;

public record QuestionOptionResponse(
        UUID id,
        int position,
        String content,
        boolean correct,
        String explanation
) {
    public static QuestionOptionResponse from(QuestionOption option) {
        return new QuestionOptionResponse(
                option.getId(),
                option.getPosition(),
                option.getContent(),
                option.isCorrect(),
                option.getExplanation()
        );
    }
}
