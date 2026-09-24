package com.fesherprep.fesherprep_api.lesson.service;

import java.util.UUID;

public class LessonAssessmentNotFoundException extends RuntimeException {
    public LessonAssessmentNotFoundException(UUID lessonId) {
        super("Lesson assessment does not exist for lesson: " + lessonId);
    }
}
