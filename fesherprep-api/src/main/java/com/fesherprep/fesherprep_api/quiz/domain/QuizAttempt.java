package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "quiz_attempts", indexes = {
        @Index(name = "idx_attempts_user_status_date", columnList = "user_id,status,submitted_at"),
        @Index(name = "idx_attempts_quiz", columnList = "quiz_id")
})
@Check(constraints = "pass_percentage between 0 and 100 and "
        + "((status = 'IN_PROGRESS' and submitted_at is null and score_percentage is null) or "
        + "(status = 'SUBMITTED' and submitted_at is not null and score_percentage is not null "
        + "and score_percentage between 0 and 100))")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizAttempt extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false, updatable = false)
    private Quiz quiz;

    // Keep the displayed title and grading threshold even if the quiz is edited.
    @Column(name = "quiz_title", nullable = false, length = 200, updatable = false)
    private String quizTitle;

    @Column(name = "pass_percentage", nullable = false, updatable = false)
    private int passPercentage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8, updatable = false, columnDefinition = "varchar(8) default 'VI'")
    private QuestionLanguage language;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, updatable = false, columnDefinition = "varchar(24) default 'TECHNICAL'")
    private QuizCategory category;

    @Column(name = "maximum_score", nullable = false, updatable = false, columnDefinition = "integer default 100")
    private int maximumScore;

    @Column(name = "duration_seconds", updatable = false)
    private Integer durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AttemptStatus status = AttemptStatus.IN_PROGRESS;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "score_percentage", precision = 5, scale = 2)
    private BigDecimal scorePercentage;

    // Protect submission against two concurrent requests for the same attempt.
    @Version
    @Column(name = "lock_version", nullable = false)
    @Getter(AccessLevel.NONE)
    private long lockVersion;

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "attempt", cascade = CascadeType.PERSIST)
    @OrderBy("position ASC")
    private List<QuizAttemptQuestion> questions = new ArrayList<>();

    public QuizAttempt(User user, Quiz quiz, List<QuestionVersion> selectedVersions) {
        this.user = Objects.requireNonNull(user);
        this.quiz = Objects.requireNonNull(quiz);
        if (quiz.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Only published quizzes can be started");
        }
        if (selectedVersions == null || selectedVersions.isEmpty()) {
            throw new IllegalArgumentException("An attempt must contain questions");
        }
        List<QuestionVersion> selected = List.copyOf(selectedVersions);
        for (int index = 0; index < selected.size(); index++) {
            QuestionVersion version = selected.get(index);
            if (version.getQuestion().getLanguage() != quiz.getLanguage()
                    || quiz.getCategory() != QuizCategory.MIXED
                    && !version.getQuestion().getCategory().name().equals(quiz.getCategory().name())) {
                throw new IllegalArgumentException("Selected question metadata does not match the quiz");
            }
            if (version.getQuestion().getStatus() != ContentStatus.PUBLISHED
                    || !version.hasSameIdentityAs(version.getQuestion().getPublishedVersion())) {
                throw new IllegalArgumentException("Only the published version can enter a new attempt");
            }
            for (int previous = 0; previous < index; previous++) {
                if (version.getQuestion().hasSameIdentityAs(selected.get(previous).getQuestion())) {
                    throw new IllegalArgumentException("An attempt cannot contain duplicate questions");
                }
            }
        }
        validateSelection(quiz, selected);
        this.quizTitle = quiz.getTitle();
        this.passPercentage = quiz.getPassPercentage();
        this.language = quiz.getLanguage();
        this.category = quiz.getCategory();
        this.maximumScore = quiz.getMaximumScore();
        this.durationSeconds = quiz.getDurationSeconds();
        for (int index = 0; index < selected.size(); index++) {
            questions.add(new QuizAttemptQuestion(this, selected.get(index), index + 1));
        }
    }

    public List<QuizAttemptQuestion> getQuestions() {
        return Collections.unmodifiableList(questions);
    }

    /**
     * A service resolves submitted IDs to these server-side entities.
     * Validate every choice before recording any answer; blank questions score zero.
     */
    public void submit(Map<QuizAttemptQuestion, QuestionOption> selections) {
        submit(selections, Instant.now());
    }

    public void submit(
            Map<QuizAttemptQuestion, QuestionOption> selections,
            Instant submittedAt
    ) {
        if (status != AttemptStatus.IN_PROGRESS) {
            throw new IllegalStateException("An attempt can only be submitted once");
        }
        Objects.requireNonNull(selections);
        Objects.requireNonNull(submittedAt, "Submission time is required");
        Instant expiresAt = getExpiresAt();
        if (expiresAt != null && submittedAt.isAfter(expiresAt)) {
            // Do not accept answers received after the server-side deadline. Finalize
            // the existing attempt with unanswered questions so the user can view the
            // result and start a new attempt without introducing answer autosave.
            completeSubmission(expiresAt);
            return;
        }
        Map<QuizAttemptQuestion, QuestionOption> resolved = new LinkedHashMap<>();
        for (var entry : selections.entrySet()) {
            QuizAttemptQuestion question = questions.stream()
                    .filter(item -> item.hasSameIdentityAs(entry.getKey()))
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Question is not in this attempt"));
            QuestionOption option = question.getQuestionVersion().getOptions().stream()
                    .filter(item -> item.hasSameIdentityAs(entry.getValue()))
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Option is not in this question"));
            if (resolved.put(question, option) != null) {
                throw new IllegalArgumentException("Question was answered more than once");
            }
        }
        resolved.forEach((question, option) -> {
            if (question.getAnswer() != null
                    && !question.getAnswer().getSelectedOption().hasSameIdentityAs(option)) {
                throw new IllegalStateException("A persisted answer cannot be changed");
            }
        });
        resolved.forEach((question, option) -> {
            if (question.getAnswer() == null) {
                question.recordAnswer(option);
            }
        });
        completeSubmission(submittedAt);
    }

    public void recordAnswer(QuizAttemptQuestion attemptQuestion, QuestionOption selectedOption) {
        if (status != AttemptStatus.IN_PROGRESS) {
            throw new IllegalStateException("A submitted attempt cannot be changed");
        }
        QuizAttemptQuestion question = questions.stream()
                .filter(item -> item.hasSameIdentityAs(attemptQuestion))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question is not in this attempt"));
        QuestionOption option = question.getQuestionVersion().getOptions().stream()
                .filter(item -> item.hasSameIdentityAs(selectedOption))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Option is not in this question"));
        question.recordAnswer(option);
    }

    private void completeSubmission(Instant submittedAt) {
        long correct = questions.stream()
                .map(QuizAttemptQuestion::getAnswer)
                .filter(Objects::nonNull)
                .filter(QuizAttemptAnswer::isCorrect)
                .count();
        scorePercentage = BigDecimal.valueOf(correct * 100)
                .divide(BigDecimal.valueOf(questions.size()), 2, RoundingMode.HALF_UP);
        this.submittedAt = submittedAt;
        status = AttemptStatus.SUBMITTED;
    }

    public boolean isPassed() {
        return status == AttemptStatus.SUBMITTED
                && getScore().compareTo(getPassingScore()) >= 0;
    }

    public BigDecimal getScore() {
        if (status != AttemptStatus.SUBMITTED) {
            return null;
        }
        long correct = questions.stream()
                .map(QuizAttemptQuestion::getAnswer)
                .filter(Objects::nonNull)
                .filter(QuizAttemptAnswer::isCorrect)
                .count();
        return BigDecimal.valueOf(correct)
                .multiply(BigDecimal.valueOf(maximumScore))
                .divide(BigDecimal.valueOf(questions.size()), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros();
    }

    public BigDecimal getPassingScore() {
        return BigDecimal.valueOf(maximumScore)
                .multiply(BigDecimal.valueOf(passPercentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .stripTrailingZeros();
    }

    public Instant getExpiresAt() {
        return durationSeconds == null || getCreatedAt() == null
                ? null
                : getCreatedAt().plusSeconds(durationSeconds);
    }

    private static void validateSelection(Quiz quiz, List<QuestionVersion> selected) {
        if (quiz.getSelectionMode() == QuizSelectionMode.FIXED) {
            List<QuizFixedQuestion> configured = quiz.getFixedQuestions();
            if (configured.size() != selected.size()) {
                throw new IllegalArgumentException("Selection does not match the fixed quiz");
            }
            for (int i = 0; i < configured.size(); i++) {
                if (!configured.get(i).getQuestion().hasSameIdentityAs(selected.get(i).getQuestion())) {
                    throw new IllegalArgumentException("Fixed quiz questions and order must match");
                }
            }
        } else {
            long expectedCount = quiz.getRules().stream().mapToLong(QuizRule::getQuestionCount).sum();
            if (selected.size() != expectedCount) {
                throw new IllegalArgumentException("Selection does not match the configured question count");
            }
            for (QuestionVersion version : selected) {
                long matchingRules = quiz.getRules().stream()
                        .filter(rule -> rule.matches(version.getQuestion())).count();
                if (matchingRules != 1) {
                    throw new IllegalArgumentException("Each question must match exactly one selection rule");
                }
            }
            for (QuizRule rule : quiz.getRules()) {
                long actual = selected.stream().filter(v -> rule.matches(v.getQuestion())).count();
                if (actual != rule.getQuestionCount()) {
                    throw new IllegalArgumentException("Selection violates a topic or difficulty rule");
                }
            }
        }
    }
}
