package com.fesherprep.fesherprep_api.practice.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "user_practice_progress", uniqueConstraints = @UniqueConstraint(
        name = "uk_user_practice_progress", columnNames = {"user_id", "exercise_id"}
))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPracticeProgress extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false, updatable = false)
    private PracticeExercise exercise;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Version
    @Column(nullable = false)
    private long version;

    public UserPracticeProgress(User user, PracticeExercise exercise) {
        this.user = Objects.requireNonNull(user);
        this.exercise = Objects.requireNonNull(exercise);
    }

    public boolean recordAttempt(boolean correct, Instant now) {
        attemptCount++;
        if (correct && completedAt == null) {
            completedAt = Objects.requireNonNull(now);
            return true;
        }
        return false;
    }
}

