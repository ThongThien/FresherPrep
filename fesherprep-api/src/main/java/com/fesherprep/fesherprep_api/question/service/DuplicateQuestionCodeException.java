package com.fesherprep.fesherprep_api.question.service;

public class DuplicateQuestionCodeException extends RuntimeException {
    public DuplicateQuestionCodeException(String code) {
        super("Question code is already in use: " + code);
    }
}
