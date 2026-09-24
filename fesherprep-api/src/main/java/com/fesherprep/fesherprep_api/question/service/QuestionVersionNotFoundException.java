package com.fesherprep.fesherprep_api.question.service;

import java.util.UUID;

public class QuestionVersionNotFoundException extends RuntimeException {
    public QuestionVersionNotFoundException(UUID id) {
        super("Question version does not exist: " + id);
    }
}
