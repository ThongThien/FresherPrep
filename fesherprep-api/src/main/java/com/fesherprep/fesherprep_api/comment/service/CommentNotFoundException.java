package com.fesherprep.fesherprep_api.comment.service;

import java.util.UUID;

public class CommentNotFoundException extends RuntimeException {
    public CommentNotFoundException(UUID id) {
        super("Comment does not exist: " + id);
    }
}
