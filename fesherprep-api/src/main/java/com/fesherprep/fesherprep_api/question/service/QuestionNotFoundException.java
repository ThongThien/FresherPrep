package com.fesherprep.fesherprep_api.question.service;

import java.util.UUID;

public class QuestionNotFoundException extends RuntimeException {
    public QuestionNotFoundException(UUID id) {
        super("Question does not exist: " + id);
    }
}
