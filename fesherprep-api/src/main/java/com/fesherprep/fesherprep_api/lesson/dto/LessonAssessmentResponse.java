package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.quiz.domain.LessonAssessment;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.util.UUID;

public record LessonAssessmentResponse(
        UUID id,
        UUID lessonId,
        UUID quizId,
        String quizCode,
        String quizTitle,
        ContentStatus quizStatus,
        int passPercentage
) {
    public static LessonAssessmentResponse from(LessonAssessment assessment) {
        return new LessonAssessmentResponse(
                assessment.getId(),
                assessment.getLesson().getId(),
                assessment.getQuiz().getId(),
                assessment.getQuiz().getCode(),
                assessment.getQuiz().getTitle(),
                assessment.getQuiz().getStatus(),
                assessment.getPassPercentage()
        );
    }
}
