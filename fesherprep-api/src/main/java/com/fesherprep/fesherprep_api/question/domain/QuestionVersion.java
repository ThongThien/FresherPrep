package com.fesherprep.fesherprep_api.question.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.Immutable;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "question_versions", uniqueConstraints =
        @UniqueConstraint(name = "uk_question_version", columnNames = {"question_id", "version_number"}))
@Check(constraints = "version_number > 0")
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionVersion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false, updatable = false)
    private Question question;

    @Column(name = "version_number", nullable = false, updatable = false)
    private int versionNumber;

    @Column(nullable = false, columnDefinition = "text", updatable = false)
    private String content;

    @Column(nullable = false, columnDefinition = "text", updatable = false)
    private String explanation;

    @Getter(AccessLevel.NONE)
    @OneToMany(mappedBy = "questionVersion", cascade = CascadeType.PERSIST)
    @OrderBy("position ASC")
    @Immutable
    private List<QuestionOption> options = new ArrayList<>();

    public QuestionVersion(Question question, int versionNumber, String content,
                           String explanation, List<OptionDefinition> choices) {
        this.question = Objects.requireNonNull(question);
        if (versionNumber < 1) {
            throw new IllegalArgumentException("Version number must be positive");
        }
        if (content == null || content.isBlank() || explanation == null || explanation.isBlank()) {
            throw new IllegalArgumentException("Question and explanation are required");
        }
        if (choices == null || choices.size() != 4
                || choices.stream().filter(OptionDefinition::correct).count() != 1) {
            throw new IllegalArgumentException("A question needs four choices and exactly one correct answer");
        }
        this.versionNumber = versionNumber;
        this.content = content;
        this.explanation = explanation;
        for (int index = 0; index < choices.size(); index++) {
            OptionDefinition choice = choices.get(index);
            options.add(new QuestionOption(this, index + 1, choice.content(), choice.correct(), choice.explanation()));
        }
    }

    public List<QuestionOption> getOptions() {
        return Collections.unmodifiableList(options);
    }

    @PrePersist
    void validateOptions() {
        if (options.size() != 4 || options.stream().filter(QuestionOption::isCorrect).count() != 1) {
            throw new IllegalStateException("A question needs four choices and exactly one correct answer");
        }
    }

    public record OptionDefinition(String content, boolean correct, String explanation) {}
}
