package com.fesherprep.fesherprep_api.pet.dto;

import java.util.List;

public record PetCollectionResponse(
        PetStateResponse activePet,
        List<PetStateResponse> completedPets,
        List<PetDefinitionResponse> availablePets
) {}
