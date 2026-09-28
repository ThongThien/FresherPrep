package com.fesherprep.fesherprep_api.comment.dto;

import com.fesherprep.fesherprep_api.comment.domain.CommentTargetType;
import com.fesherprep.fesherprep_api.comment.domain.ContentComment;

import java.time.Instant;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        CommentTargetType targetType,
        UUID targetId,
        UUID authorId,
        String authorName,
        String content,
        Instant createdAt,
        Instant updatedAt,
        Instant editedAt,
        boolean ownedByCurrentUser
) {
    public static CommentResponse from(ContentComment comment, UUID currentUserId) {
        return new CommentResponse(
                comment.getId(), comment.getTargetType(), comment.getTargetId(),
                comment.getAuthor().getId(), comment.getAuthor().getDisplayName(),
                comment.getContent(), comment.getCreatedAt(), comment.getUpdatedAt(),
                comment.getEditedAt(), comment.getAuthor().getId().equals(currentUserId)
        );
    }
}
