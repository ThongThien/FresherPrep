package com.fesherprep.fesherprep_api.user.dto;

import java.time.Instant;

public record TokenPairResponse(
        String tokenType,
        String accessToken,
        Instant accessTokenExpiresAt,
        String refreshToken
) {
    public TokenPairResponse(String accessToken, Instant accessTokenExpiresAt, String refreshToken) {
        this("Bearer", accessToken, accessTokenExpiresAt, refreshToken);
    }

    @Override
    public String toString() {
        return "TokenPairResponse[tokenType=" + tokenType
                + ", accessToken=[REDACTED], accessTokenExpiresAt=" + accessTokenExpiresAt
                + ", refreshToken=[REDACTED]]";
    }
}
