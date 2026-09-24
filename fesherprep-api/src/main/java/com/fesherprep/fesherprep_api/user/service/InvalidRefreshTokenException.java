package com.fesherprep.fesherprep_api.user.service;

import org.springframework.security.core.AuthenticationException;

public class InvalidRefreshTokenException extends AuthenticationException {
    public InvalidRefreshTokenException() {
        super("Refresh token is invalid or expired");
    }
}
