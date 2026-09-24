package com.fesherprep.fesherprep_api.lesson.domain;

import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import jakarta.persistence.*;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotNull;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;

@Entity
@Table(name = "lesson_prerequisites", uniqueConstraints = {
        @UniqueConstraint(name = "uk_lesson_prerequisite", columnNames = { "lesson_id", "prerequisite_lesson_id" })
}, indexes = {
        @Index(name = "idx_lesson_prerequisites_required", columnList = "prerequisite_lesson_id")
})
@Check(constraints = "lesson_id <> prerequisite_lesson_id")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LessonPrerequisite extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false, updatable = false)
    private Lesson lesson;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prerequisite_lesson_id", nullable = false, updatable = false)
    private Lesson prerequisiteLesson;

    public LessonPrerequisite(Lesson lesson, Lesson prerequisiteLesson) {
        this.lesson = Objects.requireNonNull(lesson, "Lesson is required");
        this.prerequisiteLesson = Objects.requireNonNull(prerequisiteLesson, "Prerequisite lesson is required");
        if (lesson == prerequisiteLesson || lesson.getId() != null
                && lesson.getId().equals(prerequisiteLesson.getId())) {
            throw new IllegalArgumentException("A lesson cannot require itself");
        }
        // Checking cycles across multiple rows belongs in the application service
        // before insertion.
    }
}
