package com.fesherprep.fesherprep_api.contribution.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "content_submissions", uniqueConstraints = @UniqueConstraint(
        name = "uk_content_submission_target", columnNames = {"content_type", "content_id"}
), indexes = {
        @Index(name = "idx_content_submissions_owner_status", columnList = "submitted_by,status"),
        @Index(name = "idx_content_submissions_review_queue", columnList = "status,submitted_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentSubmission extends BaseEntity {
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 16, updatable = false)
    private ContributionContentType contentType;

    @NotNull
    @Column(name = "content_id", nullable = false, updatable = false)
    private UUID contentId;

    @NotBlank
    @Size(max = 200)
    @Column(name = "content_title", nullable = false, length = 200)
    private String contentTitle;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by", nullable = false, updatable = false)
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ReviewStatus status = ReviewStatus.DRAFT;

    @Size(max = 2000)
    @Column(name = "review_comment", length = 2000)
    private String reviewComment;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ContentSubmission(
            ContributionContentType contentType,
            UUID contentId,
            String contentTitle,
            User submittedBy
    ) {
        this.contentType = Objects.requireNonNull(contentType, "Content type is required");
        this.contentId = Objects.requireNonNull(contentId, "Content id is required");
        rename(contentTitle);
        this.submittedBy = Objects.requireNonNull(submittedBy, "Contributor is required");
    }

    public void rename(String contentTitle) {
        String value = Objects.requireNonNull(contentTitle, "Content title is required").strip();
        if (value.isEmpty() || value.length() > 200) {
            throw new IllegalArgumentException("Content title must contain between 1 and 200 characters");
        }
        this.contentTitle = value;
    }

    public void beginEditing() {
        if (status == ReviewStatus.REJECTED) {
            status = ReviewStatus.DRAFT;
            reviewedBy = null;
            reviewedAt = null;
            return;
        }
        if (status != ReviewStatus.DRAFT) {
            throw new IllegalStateException("Only draft or rejected content can be edited");
        }
    }

    public void beginPublishedQuestionRevision() {
        if (contentType != ContributionContentType.QUESTION || status != ReviewStatus.PUBLISHED) {
            throw new IllegalStateException("Only a published question can start a new revision");
        }
        status = ReviewStatus.DRAFT;
        reviewedBy = null;
        reviewedAt = null;
        reviewComment = null;
    }

    public void submit(Instant now) {
        if (status != ReviewStatus.DRAFT && status != ReviewStatus.REJECTED) {
            throw new IllegalStateException("Only draft or rejected content can be submitted");
        }
        status = ReviewStatus.PENDING_REVIEW;
        submittedAt = Objects.requireNonNull(now, "Submission time is required");
        reviewedBy = null;
        reviewedAt = null;
    }

    public void reject(User reviewer, String comment, Instant now) {
        requirePendingReview();
        String reason = Objects.requireNonNull(comment, "Rejection reason is required").strip();
        if (reason.isEmpty()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        reviewedBy = Objects.requireNonNull(reviewer, "Reviewer is required");
        reviewComment = reason;
        reviewedAt = Objects.requireNonNull(now, "Review time is required");
        status = ReviewStatus.REJECTED;
    }

    public void publish(User reviewer, Instant now) {
        requirePendingReview();
        reviewedBy = Objects.requireNonNull(reviewer, "Reviewer is required");
        reviewComment = null;
        reviewedAt = Objects.requireNonNull(now, "Review time is required");
        status = ReviewStatus.PUBLISHED;
    }

    private void requirePendingReview() {
        if (status != ReviewStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Only pending content can be reviewed");
        }
    }
}
