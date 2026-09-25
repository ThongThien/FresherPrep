package com.fesherprep.fesherprep_api.contribution.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Entity
@Table(name = "content_review_events", indexes =
        @Index(name = "idx_content_review_events_submission", columnList = "submission_id,created_at"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentReviewEvent extends BaseEntity {
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false, updatable = false)
    private ContentSubmission submission;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false, updatable = false)
    private User actor;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, updatable = false)
    private ReviewAction action;

    @Size(max = 2000)
    @Column(length = 2000, updatable = false)
    private String comment;

    public ContentReviewEvent(
            ContentSubmission submission,
            User actor,
            ReviewAction action,
            String comment
    ) {
        this.submission = Objects.requireNonNull(submission);
        this.actor = Objects.requireNonNull(actor);
        this.action = Objects.requireNonNull(action);
        this.comment = comment == null ? null : comment.strip();
    }
}
