package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.PetSettings;

public record PetConfigResponse(
        int lessonCompletionPoints,
        int quizPassPoints,
        int pointsPerFood,
        int energyPerFood
) {
    public static PetConfigResponse from(PetSettings settings) {
        return new PetConfigResponse(
                settings.getLessonCompletionPoints(), settings.getQuizPassPoints(),
                settings.getPointsPerFood(), settings.getEnergyPerFood()
        );
    }
}
