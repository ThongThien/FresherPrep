package com.fesherprep.fesherprep_api.lesson.service;

import java.util.UUID;

public class LessonNotFoundException extends RuntimeException {
    public LessonNotFoundException(UUID id) {
        super("Lesson does not exist: " + id);
    }

    public LessonNotFoundException(String slug) {
        super("Lesson does not exist: " + slug);
    }
}
