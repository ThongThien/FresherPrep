package com.fesherprep.fesherprep_api.practice.service;

import java.util.UUID;

public class PracticeExerciseNotFoundException extends RuntimeException {
    public PracticeExerciseNotFoundException(UUID id) {
        super("Practice exercise does not exist: " + id);
    }
}

