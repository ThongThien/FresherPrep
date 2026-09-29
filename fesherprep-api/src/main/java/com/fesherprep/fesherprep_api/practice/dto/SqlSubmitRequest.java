package com.fesherprep.fesherprep_api.practice.dto;

import jakarta.validation.constraints.*;

public record SqlSubmitRequest(
        @NotBlank @Size(max = 2000) String query
) {
}

