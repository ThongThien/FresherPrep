package com.fesherprep.fesherprep_api.learningpath.service;

import java.util.UUID;

public class LearningPathNotFoundException extends RuntimeException {
    public LearningPathNotFoundException(UUID id) {
        super("Learning path does not exist: " + id);
    }
}
