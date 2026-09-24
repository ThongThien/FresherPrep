package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "quiz_attempt_questions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_attempt_question_position", columnNames = {"attempt_id", "position"}),
        @UniqueConstraint(name = "uk_attempt_question_version", columnNames = {"attempt_id", "question_version_id"})
}, indexes = @Index(name = "idx_attempt_questions_subtopic", columnList = "subtopic_id"))
@Check(constraints = "position > 0")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizAttemptQuestion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_id", nullable = false, updatable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_version_id", nullable = false, updatable = false)
    private QuestionVersion questionVersion;

    // Topic classification at the time of selection, used by historical dashboard queries.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subtopic_id", nullable = false, updatable = false)
    private KnowledgeNode subtopic;

    @Column(nullable = false, updatable = false)
    private int position;

    @OneToOne(mappedBy = "attemptQuestion", fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    private QuizAttemptAnswer answer;

    QuizAttemptQuestion(QuizAttempt attempt, QuestionVersion version, int position) {
        this.attempt = attempt;
        this.questionVersion = version;
        this.subtopic = version.getQuestion().getSubtopic();
        this.position = position;
    }

    void recordAnswer(QuestionOption selectedOption) {
        if (answer != null || attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
            throw new IllegalStateException("Answer is already final");
        }
        answer = new QuizAttemptAnswer(this, selectedOption);
    }
}
