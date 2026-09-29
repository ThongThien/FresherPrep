package com.fesherprep.fesherprep_api.practice.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Entity
@Table(name = "practice_submissions", indexes = @Index(
        name = "idx_practice_submission_user_created", columnList = "user_id,created_at"
))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PracticeSubmission extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exercise_id", nullable = false, updatable = false)
    private PracticeExercise exercise;

    @Column(name = "submitted_query", nullable = false, updatable = false, columnDefinition = "text")
    private String submittedQuery;

    @Column(nullable = false, updatable = false)
    private boolean correct;

    public PracticeSubmission(User user, PracticeExercise exercise, String submittedQuery, boolean correct) {
        this.user = Objects.requireNonNull(user);
        this.exercise = Objects.requireNonNull(exercise);
        this.submittedQuery = Objects.requireNonNull(submittedQuery);
        this.correct = correct;
    }
}

