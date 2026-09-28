package com.fesherprep.fesherprep_api.user.dto;

import java.time.Instant;
import java.util.UUID;

public record LoginChallengeResponse(
        UUID id,
        String question,
        String hint,
        Instant expiresAt
) {
}
