package com.fesherprep.fesherprep_api.practice.dto;

import com.fesherprep.fesherprep_api.practice.domain.*;
import java.util.UUID;

public record PracticeExerciseSummaryResponse(
        UUID id, String code, String title, PracticeDifficulty difficulty,
        String concepts, int displayOrder, boolean locked, boolean completed
) {
}

