package com.fesherprep.fesherprep_api.pet.dto;

import com.fesherprep.fesherprep_api.pet.domain.PetSettings;

import java.util.List;

public record PetConfigResponse(
        int lessonCompletionPoints,
        int quizPassPoints,
        int pointsPerFood,
        int energyPerFood,
        int maximumLevel,
        List<PetLevelConfigResponse> levels
) {
    public static PetConfigResponse from(PetSettings settings, List<PetLevelConfigResponse> levels) {
        return new PetConfigResponse(
                settings.getLessonCompletionPoints(), settings.getQuizPassPoints(),
                settings.getPointsPerFood(), settings.getEnergyPerFood(), settings.getMaxLevel(), levels
        );
    }
}
