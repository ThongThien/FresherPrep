package com.fesherprep.fesherprep_api.contribution.dto;

import com.fesherprep.fesherprep_api.contribution.domain.ContentReviewEvent;
import com.fesherprep.fesherprep_api.contribution.domain.ReviewAction;

import java.time.Instant;
import java.util.UUID;

public record ReviewHistoryResponse(
        UUID id,
        ReviewAction action,
        UUID actorId,
        String actorName,
        String comment,
        Instant occurredAt
) {
    public static ReviewHistoryResponse from(ContentReviewEvent event) {
        return new ReviewHistoryResponse(
                event.getId(), event.getAction(), event.getActor().getId(),
                event.getActor().getDisplayName(), event.getComment(), event.getCreatedAt()
        );
    }
}
