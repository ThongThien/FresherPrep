package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Entity
@Table(name = "quiz_attempt_answers", uniqueConstraints =
        @UniqueConstraint(name = "uk_attempt_answer_question", columnNames = "attempt_question_id"))
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizAttemptAnswer extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attempt_question_id", nullable = false, updatable = false)
    private QuizAttemptQuestion attemptQuestion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "selected_option_id", nullable = false, updatable = false)
    private QuestionOption selectedOption;

    @Column(name = "is_correct", nullable = false, updatable = false)
    private boolean correct;

    QuizAttemptAnswer(QuizAttemptQuestion question, QuestionOption option) {
        if (option == null || !question.getQuestionVersion().hasSameIdentityAs(option.getQuestionVersion())) {
            throw new IllegalArgumentException("Option is not in the attempted version");
        }
        this.attemptQuestion = question;
        this.selectedOption = option;
        this.correct = option.isCorrect();
    }
}
