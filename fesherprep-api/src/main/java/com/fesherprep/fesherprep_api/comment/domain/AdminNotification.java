package com.fesherprep.fesherprep_api.comment.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "admin_notifications", uniqueConstraints = @UniqueConstraint(
        name = "uk_admin_notification_recipient_comment", columnNames = {"recipient_id", "comment_id"}
), indexes = @Index(name = "idx_admin_notifications_recipient_read", columnList = "recipient_id,read_at,created_at"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminNotification extends BaseEntity {
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false, updatable = false)
    private User recipient;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "comment_id", nullable = false, updatable = false)
    private ContentComment comment;

    @Column(name = "read_at")
    private Instant readAt;

    public AdminNotification(User recipient, ContentComment comment) {
        this.recipient = Objects.requireNonNull(recipient, "Notification recipient is required");
        this.comment = Objects.requireNonNull(comment, "Notification comment is required");
    }

    public void markRead(Instant now) {
        if (readAt == null) {
            readAt = Objects.requireNonNull(now, "Read time is required");
        }
    }
}
