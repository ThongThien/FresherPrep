package com.fesherprep.fesherprep_api.quiz.domain;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Entity
@Table(name = "lesson_assessments", uniqueConstraints =
        @UniqueConstraint(name = "uk_lesson_assessment", columnNames = "lesson_id"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LessonAssessment extends BaseEntity {
    public static final int PASS_PERCENTAGE = 80;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    public LessonAssessment(Lesson lesson, Quiz quiz) {
        this.lesson = Objects.requireNonNull(lesson);
        this.quiz = Objects.requireNonNull(quiz);
        if (quiz.getType() != QuizType.LESSON) {
            throw new IllegalArgumentException("Lesson assessment requires a lesson quiz");
        }
        if (quiz.getPassPercentage() != PASS_PERCENTAGE) {
            throw new IllegalArgumentException("Lesson assessment pass percentage must be 80");
        }
        if (quiz.getSelectionMode() == QuizSelectionMode.FIXED) {
            if (quiz.getFixedQuestions().isEmpty() || quiz.getFixedQuestions().stream()
                    .anyMatch(item -> !lesson.getSubtopic().hasSameIdentityAs(item.getQuestion().getSubtopic()))) {
                throw new IllegalArgumentException("Assessment questions must match the lesson subtopic");
            }
        } else if (quiz.getRules().isEmpty() || quiz.getRules().stream()
                .anyMatch(rule -> !lesson.getSubtopic().hasSameIdentityAs(rule.getKnowledgeNode()))) {
            throw new IllegalArgumentException("Assessment rules must match the lesson subtopic");
        }
    }

    // The quiz is the single source of its pass threshold; attempts snapshot it.
    public int getPassPercentage() {
        return quiz.getPassPercentage();
    }
}
