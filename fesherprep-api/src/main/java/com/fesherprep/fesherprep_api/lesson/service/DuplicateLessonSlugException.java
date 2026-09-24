package com.fesherprep.fesherprep_api.lesson.service;

public class DuplicateLessonSlugException extends RuntimeException {
    public DuplicateLessonSlugException(String slug) {
        super("Lesson slug is already in use: " + slug);
    }
}
