package com.fesherprep.fesherprep_api.pet.dto;

public record PetAssetUploadResponse(
        String assetReference,
        String contentType,
        long size
) {}
