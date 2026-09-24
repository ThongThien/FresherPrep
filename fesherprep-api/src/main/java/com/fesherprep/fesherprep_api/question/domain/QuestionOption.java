package com.fesherprep.fesherprep_api.question.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "question_options", uniqueConstraints =
        @UniqueConstraint(name = "uk_question_option_position", columnNames = {"question_version_id", "position"}))
@Check(constraints = "position between 1 and 4")
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuestionOption extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_version_id", nullable = false, updatable = false)
    private QuestionVersion questionVersion;

    @Column(nullable = false, updatable = false)
    private int position;

    @Column(nullable = false, columnDefinition = "text", updatable = false)
    private String content;

    @Column(name = "is_correct", nullable = false, updatable = false)
    private boolean correct;

    @Column(nullable = false, columnDefinition = "text", updatable = false)
    private String explanation;

    QuestionOption(QuestionVersion version, int position, String content, boolean correct, String explanation) {
        if (content == null || content.isBlank() || explanation == null || explanation.isBlank()) {
            throw new IllegalArgumentException("Every choice needs content and an explanation");
        }
        this.questionVersion = version;
        this.position = position;
        this.content = content;
        this.correct = correct;
        this.explanation = explanation;
    }
}
