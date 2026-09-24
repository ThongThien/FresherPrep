package com.fesherprep.fesherprep_api.quiz.service;

public class DuplicateQuizCodeException extends RuntimeException {
    public DuplicateQuizCodeException(String code) {
        super("Quiz code is already in use: " + code);
    }
}
