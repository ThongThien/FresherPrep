package com.fesherprep.fesherprep_api.comment.dto;

import com.fesherprep.fesherprep_api.comment.domain.AdminNotification;
import com.fesherprep.fesherprep_api.comment.domain.CommentTargetType;

import java.time.Instant;
import java.util.UUID;

public record AdminNotificationResponse(
        UUID id,
        UUID commentId,
        CommentTargetType targetType,
        UUID targetId,
        String targetTitle,
        String authorName,
        String commentContent,
        Instant createdAt,
        Instant readAt
) {
    public static AdminNotificationResponse from(AdminNotification notification) {
        var comment = notification.getComment();
        return new AdminNotificationResponse(
                notification.getId(), comment.getId(), comment.getTargetType(), comment.getTargetId(),
                comment.getTargetTitle(), comment.getAuthor().getDisplayName(), comment.getContent(),
                notification.getCreatedAt(), notification.getReadAt()
        );
    }
}
