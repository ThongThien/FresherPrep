package com.fesherprep.fesherprep_api.contribution.service;

import java.util.UUID;

public class ContributionNotFoundException extends RuntimeException {
    public ContributionNotFoundException(UUID id) {
        super("Contribution not found: " + id);
    }
}
