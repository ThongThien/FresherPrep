package com.fesherprep.fesherprep_api.user.dto;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;

public record LoginChallengeErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        Map<String, String> fieldErrors,
        LoginChallengeResponse challenge
) {
    public static LoginChallengeErrorResponse required(LoginChallengeResponse challenge) {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        return new LoginChallengeErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                "LOGIN_CHALLENGE_REQUIRED",
                "Complete the Java knowledge challenge to continue",
                Map.of(),
                challenge
        );
    }
}
