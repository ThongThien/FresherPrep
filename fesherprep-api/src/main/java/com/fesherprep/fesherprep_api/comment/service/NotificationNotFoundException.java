package com.fesherprep.fesherprep_api.comment.service;

import java.util.UUID;

public class NotificationNotFoundException extends RuntimeException {
    public NotificationNotFoundException(UUID id) {
        super("Notification does not exist: " + id);
    }
}
