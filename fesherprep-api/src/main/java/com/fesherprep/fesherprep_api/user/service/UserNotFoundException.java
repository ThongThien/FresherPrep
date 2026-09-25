package com.fesherprep.fesherprep_api.user.service;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(UUID userId) {
        super("User not found: " + userId);
    }
}
