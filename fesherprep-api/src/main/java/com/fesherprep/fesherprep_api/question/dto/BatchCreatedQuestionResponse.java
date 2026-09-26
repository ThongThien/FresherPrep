package com.fesherprep.fesherprep_api.question.dto;

import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;

public record BatchCreatedQuestionResponse(
        QuestionResponse question,
        QuestionVersionResponse version
) {
    public static BatchCreatedQuestionResponse from(Question question, QuestionVersion version) {
        return new BatchCreatedQuestionResponse(
                QuestionResponse.from(question),
                QuestionVersionResponse.from(version)
        );
    }
}
