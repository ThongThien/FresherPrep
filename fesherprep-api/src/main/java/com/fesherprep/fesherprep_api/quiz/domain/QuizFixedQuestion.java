package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "quiz_fixed_questions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_quiz_fixed_question", columnNames = {"quiz_id", "question_id"}),
        @UniqueConstraint(name = "uk_quiz_fixed_position", columnNames = {"quiz_id", "position"})
})
@Check(constraints = "position > 0")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class QuizFixedQuestion extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private int position;

    QuizFixedQuestion(Quiz quiz, Question question, int position) {
        this.quiz = quiz;
        this.question = question;
        this.position = position;
    }

    void changePosition(int position) {
        if (position < 1) {
            throw new IllegalArgumentException("Fixed question position must be positive");
        }
        this.position = position;
    }
}
