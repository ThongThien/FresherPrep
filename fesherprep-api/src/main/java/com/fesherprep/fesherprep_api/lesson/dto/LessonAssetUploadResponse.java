package com.fesherprep.fesherprep_api.lesson.dto;

public record LessonAssetUploadResponse(
        String assetReference,
        String contentType,
        long size
) {
}
