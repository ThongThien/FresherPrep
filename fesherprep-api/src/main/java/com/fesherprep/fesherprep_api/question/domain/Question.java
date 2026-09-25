package com.fesherprep.fesherprep_api.question.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_questions_selection", columnList = "subtopic_id,status,difficulty"),
        @Index(name = "idx_questions_admin_filter", columnList = "language,category,status,difficulty")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subtopic_id", nullable = false)
    private KnowledgeNode subtopic;

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8, columnDefinition = "varchar(8) default 'VI'")
    private QuestionLanguage language = QuestionLanguage.VI;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16, columnDefinition = "varchar(16) default 'TECHNICAL'")
    private QuestionCategory category = QuestionCategory.TECHNICAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ContentStatus status = ContentStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_version_id")
    private QuestionVersion publishedVersion;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Question(KnowledgeNode subtopic, Difficulty difficulty) {
        assignSubtopic(subtopic);
        this.difficulty = Objects.requireNonNull(difficulty, "Difficulty is required");
    }

    public Question(KnowledgeNode subtopic, String code, Difficulty difficulty) {
        this(subtopic, code, difficulty, QuestionLanguage.VI, QuestionCategory.TECHNICAL);
    }

    public Question(
            KnowledgeNode subtopic,
            String code,
            Difficulty difficulty,
            QuestionLanguage language,
            QuestionCategory category
    ) {
        assignSubtopic(subtopic);
        changeCode(code);
        this.difficulty = Objects.requireNonNull(difficulty, "Difficulty is required");
        this.language = Objects.requireNonNull(language, "Question language is required");
        this.category = Objects.requireNonNull(category, "Question category is required");
    }

    public void updateMetadata(KnowledgeNode subtopic, String code, Difficulty difficulty) {
        updateMetadata(subtopic, code, difficulty, QuestionLanguage.VI, QuestionCategory.TECHNICAL);
    }

    public void updateMetadata(
            KnowledgeNode subtopic,
            String code,
            Difficulty difficulty,
            QuestionLanguage language,
            QuestionCategory category
    ) {
        assignSubtopic(subtopic);
        changeCode(code);
        this.difficulty = Objects.requireNonNull(difficulty, "Difficulty is required");
        this.language = Objects.requireNonNull(language, "Question language is required");
        this.category = Objects.requireNonNull(category, "Question category is required");
    }

    public void changeStatus(ContentStatus status) {
        Objects.requireNonNull(status, "Content status is required");
        if (status == ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Publish a valid question version instead");
        }
        this.status = this.status.transitionTo(status);
    }

    public void submitForReview() {
        if (status != ContentStatus.DRAFT) {
            throw new IllegalStateException("Only a draft question can enter review");
        }
        status = ContentStatus.REVIEW;
    }

    public void publish(QuestionVersion version) {
        Objects.requireNonNull(version);
        if (!hasSameIdentityAs(version.getQuestion())) {
            throw new IllegalArgumentException("Version belongs to another question");
        }
        if (status != ContentStatus.REVIEW && status != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Question must be reviewed before publication");
        }
        version.validateOptions();
        publishedVersion = version;
        status = ContentStatus.PUBLISHED;
    }

    public void archive() {
        changeStatus(ContentStatus.ARCHIVED);
    }

    private void assignSubtopic(KnowledgeNode subtopic) {
        this.subtopic = Objects.requireNonNull(subtopic, "Subtopic is required");
        if (subtopic.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("Question must belong to a subtopic");
        }
    }

    private void changeCode(String code) {
        String value = Objects.requireNonNull(code, "Question code is required").strip();
        if (value.isEmpty() || value.length() > 50) {
            throw new IllegalArgumentException("Question code must contain between 1 and 50 characters");
        }
        this.code = value;
    }
}
