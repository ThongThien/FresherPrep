package com.fesherprep.fesherprep_api.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        UUID challengeId,
        @Size(max = 100) String challengeAnswer
) {
    @Override
    public String toString() {
        return "LoginRequest[email=" + email
                + ", password=[REDACTED], challengeId=" + challengeId
                + ", challengeAnswer=[REDACTED]]";
    }
}
