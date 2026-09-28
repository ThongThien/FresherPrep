package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.user.dto.LoginChallengeResponse;
import org.springframework.security.core.AuthenticationException;

public class LoginChallengeRequiredException extends AuthenticationException {
    private final LoginChallengeResponse challenge;

    public LoginChallengeRequiredException(LoginChallengeResponse challenge) {
        super("Login challenge is required");
        this.challenge = challenge;
    }

    public LoginChallengeResponse getChallenge() {
        return challenge;
    }
}
