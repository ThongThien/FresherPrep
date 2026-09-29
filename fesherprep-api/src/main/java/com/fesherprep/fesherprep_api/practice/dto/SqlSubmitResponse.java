package com.fesherprep.fesherprep_api.practice.dto;

public record SqlSubmitResponse(
        boolean correct,
        boolean firstCompletion,
        int awardedPoints,
        String message,
        String explanation,
        SqlResultTableResponse result
) {
}

