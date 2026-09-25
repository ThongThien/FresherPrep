package com.fesherprep.fesherprep_api.contribution.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectContentRequest(
        @NotBlank @Size(max = 2000) String reason
) {
}
