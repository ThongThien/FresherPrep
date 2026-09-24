package com.fesherprep.fesherprep_api.user.service;

public class EmailAlreadyUsedException extends RuntimeException {
    public EmailAlreadyUsedException() {
        super("Email is already registered");
    }
}
