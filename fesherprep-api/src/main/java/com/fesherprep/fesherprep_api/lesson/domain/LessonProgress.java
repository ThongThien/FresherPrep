package com.fesherprep.fesherprep_api.lesson.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.Duration;
import java.time.Instant;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "lesson_progress", uniqueConstraints = {
        @UniqueConstraint(name = "uk_lesson_progress_user_lesson", columnNames = { "user_id", "lesson_id" })
}, indexes = {
        @Index(name = "idx_lesson_progress_lesson", columnList = "lesson_id"),
        @Index(name = "idx_lesson_progress_user_last_viewed", columnList = "user_id, last_viewed_at")
})
@Check(constraints = "active_seconds >= 0 and max_scroll_percent between 0 and 100")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LessonProgress extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false, updatable = false)
    private Lesson lesson;

    @PositiveOrZero
    @Column(name = "active_seconds", nullable = false)
    private long activeSeconds;

    @Min(0)
    @Max(100)
    @Column(name = "max_scroll_percent", nullable = false)
    private int maxScrollPercent;

    @NotNull
    @Column(name = "last_viewed_at", nullable = false)
    private Instant lastViewedAt;

    @Column(name = "read_qualified_at")
    private Instant readQualifiedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public LessonProgress(User user, Lesson lesson, Instant startedAt) {
        this.user = Objects.requireNonNull(user, "User is required");
        this.lesson = Objects.requireNonNull(lesson, "Lesson is required");
        this.lastViewedAt = Objects.requireNonNull(startedAt, "Start time is required");
    }

    /**
     * The backend supplies accepted active time and its own timestamp after
     * checking the heartbeat.
     * Read qualification alone never completes a lesson: completion also requires a
     * submitted,
     * passing lesson assessment and is derived by joining the user's quiz history.
     */
    public void recordReading(long acceptedActiveSeconds, int scrollPercent, Instant viewedAt) {
        Objects.requireNonNull(viewedAt, "View time is required");
        if (viewedAt.isBefore(lastViewedAt) || acceptedActiveSeconds < 0
                || acceptedActiveSeconds > Duration.between(lastViewedAt, viewedAt).getSeconds()) {
            throw new IllegalArgumentException("Active time must fit the elapsed heartbeat interval");
        }
        if (scrollPercent < 0 || scrollPercent > 100) {
            throw new IllegalArgumentException("Scroll percentage must be between 0 and 100");
        }
        activeSeconds = Math.addExact(activeSeconds, acceptedActiveSeconds);
        maxScrollPercent = Math.max(maxScrollPercent, scrollPercent);
        lastViewedAt = viewedAt;
        if (readQualifiedAt == null && activeSeconds >= lesson.getMinimumReadSeconds()
                && maxScrollPercent >= lesson.getRequiredScrollPercent()) {
            readQualifiedAt = viewedAt;
        }
    }
}
