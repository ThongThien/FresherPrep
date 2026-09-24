package com.fesherprep.fesherprep_api.quiz.dto;

import com.fesherprep.fesherprep_api.quiz.domain.QuizAttemptAnswer;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttemptQuestion;

import java.util.List;
import java.util.UUID;

public record QuizAttemptQuestionResponse(
        UUID id,
        UUID questionVersionId,
        String questionCode,
        int position,
        String content,
        List<QuizAttemptOptionResponse> options,
        UUID selectedOptionId,
        Boolean answerCorrect
) {
    public static QuizAttemptQuestionResponse from(
            QuizAttemptQuestion question,
            boolean revealResult
    ) {
        QuizAttemptAnswer answer = question.getAnswer();
        return new QuizAttemptQuestionResponse(
                question.getId(),
                question.getQuestionVersion().getId(),
                question.getQuestionVersion().getQuestion().getCode(),
                question.getPosition(),
                question.getQuestionVersion().getContent(),
                question.getQuestionVersion().getOptions().stream()
                        .map(option -> QuizAttemptOptionResponse.from(option, revealResult))
                        .toList(),
                answer == null ? null : answer.getSelectedOption().getId(),
                revealResult && answer != null ? answer.isCorrect() : null
        );
    }
}
