package com.fesherprep.fesherprep_api.practice.dto;

import com.fesherprep.fesherprep_api.practice.domain.*;
import java.util.UUID;

public record PracticeExerciseDetailResponse(
        UUID id, String code, String title, String description,
        PracticeDifficulty difficulty, String concepts, String schemaDescription,
        String hint, int displayOrder, boolean completed
) {
    public static PracticeExerciseDetailResponse from(PracticeExercise exercise, boolean completed) {
        return new PracticeExerciseDetailResponse(
                exercise.getId(), exercise.getCode(), exercise.getTitle(), exercise.getDescription(),
                exercise.getDifficulty(), exercise.getConcepts(), exercise.getSchemaDescription(),
                exercise.getHint(), exercise.getDisplayOrder(), completed);
    }
}

