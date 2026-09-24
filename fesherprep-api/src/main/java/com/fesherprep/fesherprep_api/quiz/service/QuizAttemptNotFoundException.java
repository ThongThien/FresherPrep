package com.fesherprep.fesherprep_api.quiz.service;

import java.util.UUID;

public class QuizAttemptNotFoundException extends RuntimeException {
    public QuizAttemptNotFoundException(UUID id) {
        super("Quiz attempt does not exist: " + id);
    }
}
