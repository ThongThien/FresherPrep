package com.fesherprep.fesherprep_api.quiz.service;

import java.util.UUID;

public class QuizNotFoundException extends RuntimeException {
    public QuizNotFoundException(UUID id) {
        super("Quiz does not exist: " + id);
    }

    public QuizNotFoundException(String code) {
        super("Quiz does not exist: " + code);
    }
}
