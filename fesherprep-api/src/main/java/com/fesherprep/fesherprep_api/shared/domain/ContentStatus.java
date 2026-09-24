package com.fesherprep.fesherprep_api.shared.domain;

import java.util.Objects;

public enum ContentStatus {
    DRAFT,
    REVIEW,
    PUBLISHED,
    ARCHIVED;

    public ContentStatus transitionTo(ContentStatus next) {
        Objects.requireNonNull(next, "Content status is required");
        if (this == next) {
            return this;
        }
        boolean allowed = switch (this) {
            case DRAFT -> next == REVIEW;
            case REVIEW -> next == DRAFT || next == PUBLISHED;
            case PUBLISHED -> next == ARCHIVED;
            case ARCHIVED -> next == DRAFT;
        };
        if (!allowed) {
            throw new IllegalStateException("Content cannot move from " + this + " to " + next);
        }
        return next;
    }
}
