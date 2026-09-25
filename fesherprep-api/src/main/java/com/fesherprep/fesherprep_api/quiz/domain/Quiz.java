package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "quizzes", indexes = {
        @Index(name = "idx_quizzes_status_type", columnList = "status,type"),
        @Index(name = "idx_quizzes_language_category_status", columnList = "language,category,status")
})
@Check(constraints = "pass_percentage between 0 and 100 and maximum_score > 0 and (duration_seconds is null or duration_seconds > 0)")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Quiz extends BaseEntity {
    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private QuizType type;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(name = "selection_mode", nullable = false, length = 16)
    private QuizSelectionMode selectionMode;

    @Column(name = "pass_percentage", nullable = false)
    private int passPercentage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8, columnDefinition = "varchar(8) default 'VI'")
    private QuestionLanguage language = QuestionLanguage.VI;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24, columnDefinition = "varchar(24) default 'TECHNICAL'")
    private QuizCategory category = QuizCategory.TECHNICAL;

    @Column(name = "maximum_score", nullable = false, columnDefinition = "integer default 100")
    private int maximumScore = 100;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ContentStatus status = ContentStatus.DRAFT;

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.PERSIST)
    private List<QuizRule> rules = new ArrayList<>();

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "quiz", cascade = CascadeType.PERSIST)
    @OrderBy("position ASC")
    private List<QuizFixedQuestion> fixedQuestions = new ArrayList<>();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Quiz(String title, QuizType type, QuizSelectionMode selectionMode, int passPercentage) {
        updateDetails(title, null, type, selectionMode, passPercentage);
    }

    public Quiz(String title, String code, QuizType type, QuizSelectionMode selectionMode, int passPercentage) {
        updateDetails(title, code, type, selectionMode, passPercentage);
    }

    public Quiz(
            String title,
            String code,
            QuizType type,
            QuizSelectionMode selectionMode,
            int passPercentage,
            QuestionLanguage language,
            QuizCategory category,
            int maximumScore
    ) {
        updateDetails(title, code, type, selectionMode, passPercentage, language, category, maximumScore, null);
    }

    public Quiz(
            String title, String code, QuizType type, QuizSelectionMode selectionMode,
            int passPercentage, QuestionLanguage language, QuizCategory category,
            int maximumScore, Integer durationSeconds
    ) {
        updateDetails(title, code, type, selectionMode, passPercentage, language, category, maximumScore, durationSeconds);
    }

    public void updateDetails(
            String title,
            String code,
            QuizType type,
            QuizSelectionMode selectionMode,
            int passPercentage
    ) {
        updateDetails(
                title,
                code,
                type,
                selectionMode,
                passPercentage,
                language == null ? QuestionLanguage.VI : language,
                category == null ? QuizCategory.TECHNICAL : category,
                maximumScore < 1 ? 100 : maximumScore,
                durationSeconds
        );
    }

    public void updateDetails(
            String title,
            String code,
            QuizType type,
            QuizSelectionMode selectionMode,
            int passPercentage,
            QuestionLanguage language,
            QuizCategory category,
            int maximumScore
    ) {
        updateDetails(title, code, type, selectionMode, passPercentage, language, category, maximumScore, durationSeconds);
    }

    public void updateDetails(
            String title,
            String code,
            QuizType type,
            QuizSelectionMode selectionMode,
            int passPercentage,
            QuestionLanguage language,
            QuizCategory category,
            int maximumScore,
            Integer durationSeconds
    ) {
        if (title == null || title.isBlank() || passPercentage < 0 || passPercentage > 100) {
            throw new IllegalArgumentException("Title and pass percentage (0-100) are required");
        }
        Objects.requireNonNull(type, "Quiz type is required");
        Objects.requireNonNull(selectionMode, "Selection mode is required");
        Objects.requireNonNull(language, "Quiz language is required");
        Objects.requireNonNull(category, "Quiz category is required");
        if (maximumScore < 1) {
            throw new IllegalArgumentException("Maximum score must be positive");
        }
        if (durationSeconds != null && durationSeconds < 1) {
            throw new IllegalArgumentException("Quiz duration must be positive");
        }
        if ((this.type != null && this.type != type
                || this.selectionMode != null && this.selectionMode != selectionMode
                || this.language != null && this.language != language
                || this.category != null && this.category != category)
                && (!rules.isEmpty() || !fixedQuestions.isEmpty())) {
            throw new IllegalStateException("Remove the current quiz configuration before changing type, mode, language, or category");
        }
        this.title = title.strip();
        if (code != null) {
            String normalizedCode = code.strip().toUpperCase(Locale.ROOT);
            if (normalizedCode.isEmpty() || normalizedCode.length() > 50) {
                throw new IllegalArgumentException("Quiz code must contain between 1 and 50 characters");
            }
            this.code = normalizedCode;
        }
        this.type = type;
        this.selectionMode = selectionMode;
        this.passPercentage = passPercentage;
        this.language = language;
        this.category = category;
        this.maximumScore = maximumScore;
        this.durationSeconds = durationSeconds;
    }

    public List<QuizRule> getRules() {
        return Collections.unmodifiableList(rules);
    }

    public List<QuizFixedQuestion> getFixedQuestions() {
        return Collections.unmodifiableList(fixedQuestions);
    }

    public void addRule(KnowledgeNode node, Difficulty difficulty, int questionCount) {
        requireDraft(QuizSelectionMode.RULE_BASED);
        Objects.requireNonNull(node);
        if (type == QuizType.LESSON && node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A lesson quiz must select a subtopic");
        }
        if (type == QuizType.TOPIC && node.getType() != NodeType.TOPIC && node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A topic quiz must select a topic or subtopic");
        }
        if ((type == QuizType.TOPIC || type == QuizType.LESSON)
                && rules.stream().anyMatch(rule -> !rule.getKnowledgeNode().hasSameIdentityAs(node))) {
            throw new IllegalArgumentException("Use a mixed quiz for multiple selection scopes");
        }
        if (rules.stream().anyMatch(rule -> rule.overlaps(node, difficulty))) {
            throw new IllegalArgumentException("Selection scopes must not overlap");
        }
        rules.add(new QuizRule(this, node, difficulty, questionCount));
    }

    public void addQuestion(Question question) {
        int nextPosition = fixedQuestions.stream()
                .mapToInt(QuizFixedQuestion::getPosition)
                .max()
                .orElse(0) + 1;
        addQuestion(question, nextPosition);
    }

    public void addQuestion(Question question, int position) {
        requireDraft(QuizSelectionMode.FIXED);
        Objects.requireNonNull(question);
        if (position < 1) {
            throw new IllegalArgumentException("Fixed question position must be positive");
        }
        if (fixedQuestions.stream().anyMatch(item -> item.getQuestion().hasSameIdentityAs(question))) {
            throw new IllegalArgumentException("A fixed quiz cannot contain a question twice");
        }
        if (fixedQuestions.stream().anyMatch(item -> item.getPosition() == position)) {
            throw new IllegalArgumentException("Fixed question position is already in use");
        }
        if (question.getLanguage() != language
                || category != QuizCategory.MIXED
                && !question.getCategory().name().equals(category.name())) {
            throw new IllegalArgumentException("Question language and category must match the quiz");
        }
        if (!fixedQuestions.isEmpty() && (type == QuizType.LESSON || type == QuizType.TOPIC)) {
            KnowledgeNode existing = fixedQuestions.getFirst().getQuestion().getSubtopic();
            KnowledgeNode incoming = question.getSubtopic();
            if (type == QuizType.TOPIC) {
                existing = topicOf(existing);
                incoming = topicOf(incoming);
            }
            if (!existing.hasSameIdentityAs(incoming)) {
                throw new IllegalArgumentException("Use a mixed quiz for questions from different scopes");
            }
        }
        fixedQuestions.add(new QuizFixedQuestion(this, question, position));
        fixedQuestions.sort(java.util.Comparator.comparingInt(QuizFixedQuestion::getPosition));
    }

    public QuizFixedQuestion removeQuestion(UUID questionId) {
        requireDraft(QuizSelectionMode.FIXED);
        QuizFixedQuestion removed = fixedQuestions.stream()
                .filter(item -> item.getQuestion().getId().equals(questionId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Fixed question does not exist"));
        fixedQuestions.remove(removed);
        return removed;
    }

    public QuizRule removeRule(UUID ruleId) {
        requireDraft(QuizSelectionMode.RULE_BASED);
        QuizRule removed = rules.stream()
                .filter(rule -> rule.getId().equals(ruleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Quiz rule does not exist"));
        rules.remove(removed);
        return removed;
    }

    public void updateRule(
            UUID ruleId,
            KnowledgeNode node,
            Difficulty difficulty,
            int questionCount
    ) {
        requireDraft(QuizSelectionMode.RULE_BASED);
        QuizRule rule = rules.stream()
                .filter(item -> item.getId().equals(ruleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Quiz rule does not exist"));
        validateRuleScope(node, difficulty, rule);
        rule.update(node, difficulty, questionCount);
    }

    public void submitForReview() {
        if (status != ContentStatus.DRAFT) {
            throw new IllegalStateException("Only a draft quiz can enter review");
        }
        status = ContentStatus.REVIEW;
    }

    public void publish() {
        if (status != ContentStatus.REVIEW) {
            throw new IllegalStateException("Quiz must be reviewed before publication");
        }
        if ((selectionMode == QuizSelectionMode.FIXED && fixedQuestions.isEmpty())
                || (selectionMode == QuizSelectionMode.RULE_BASED && rules.isEmpty())) {
            throw new IllegalStateException("A quiz needs questions or a selection rule");
        }
        status = ContentStatus.PUBLISHED;
    }

    public void archive() {
        changeStatus(ContentStatus.ARCHIVED);
    }

    public void changeStatus(ContentStatus status) {
        Objects.requireNonNull(status, "Content status is required");
        if (status == ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Use publish to validate the quiz configuration");
        }
        this.status = this.status.transitionTo(status);
    }

    private void requireDraft(QuizSelectionMode expectedMode) {
        if (status != ContentStatus.DRAFT || selectionMode != expectedMode) {
            throw new IllegalStateException("Selection can only be configured for the matching draft mode");
        }
    }

    private void validateRuleScope(KnowledgeNode node, Difficulty difficulty, QuizRule ignoredRule) {
        Objects.requireNonNull(node, "Knowledge node is required");
        if (type == QuizType.LESSON && node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A lesson quiz must select a subtopic");
        }
        if (type == QuizType.TOPIC && node.getType() != NodeType.TOPIC && node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A topic quiz must select a topic or subtopic");
        }
        if ((type == QuizType.TOPIC || type == QuizType.LESSON)
                && rules.stream().filter(rule -> rule != ignoredRule)
                .anyMatch(rule -> !rule.getKnowledgeNode().hasSameIdentityAs(node))) {
            throw new IllegalArgumentException("Use a mixed quiz for multiple selection scopes");
        }
        if (rules.stream().filter(rule -> rule != ignoredRule)
                .anyMatch(rule -> rule.overlaps(node, difficulty))) {
            throw new IllegalArgumentException("Selection scopes must not overlap");
        }
    }

    private static KnowledgeNode topicOf(KnowledgeNode subtopic) {
        for (KnowledgeNode node = subtopic; node != null; node = node.getParent()) {
            if (node.getType() == NodeType.TOPIC) {
                return node;
            }
        }
        // A shortened knowledge tree may not contain a TOPIC level.
        return subtopic;
    }
}
