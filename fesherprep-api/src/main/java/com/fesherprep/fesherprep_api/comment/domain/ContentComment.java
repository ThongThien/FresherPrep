package com.fesherprep.fesherprep_api.comment.domain;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.shared.persistence.BaseEntity;
import com.fesherprep.fesherprep_api.user.domain.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "content_comments", indexes = {
        @Index(name = "idx_content_comments_lesson_created", columnList = "lesson_id,created_at"),
        @Index(name = "idx_content_comments_quiz_created", columnList = "quiz_id,created_at"),
        @Index(name = "idx_content_comments_author_created", columnList = "author_id,created_at")
})
@Check(name = "ck_content_comments_single_target", constraints =
        "(lesson_id is not null and quiz_id is null) or (lesson_id is null and quiz_id is not null)")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentComment extends BaseEntity {
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false, updatable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", updatable = false)
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", updatable = false)
    private Quiz quiz;

    @NotBlank
    @Size(max = 2000)
    @Column(nullable = false, length = 2000)
    private String content;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "edited_at")
    private Instant editedAt;

    public ContentComment(User author, Lesson lesson, String content) {
        this.author = Objects.requireNonNull(author, "Comment author is required");
        this.lesson = Objects.requireNonNull(lesson, "Lesson is required");
        this.content = normalize(content);
    }

    public ContentComment(User author, Quiz quiz, String content) {
        this.author = Objects.requireNonNull(author, "Comment author is required");
        this.quiz = Objects.requireNonNull(quiz, "Quiz is required");
        this.content = normalize(content);
    }

    public void edit(String content, Instant now) {
        this.content = normalize(content);
        this.editedAt = Objects.requireNonNull(now, "Edit time is required");
    }

    public CommentTargetType getTargetType() {
        return lesson != null ? CommentTargetType.LESSON : CommentTargetType.QUIZ;
    }

    public UUID getTargetId() {
        return lesson != null ? lesson.getId() : quiz.getId();
    }

    public String getTargetTitle() {
        return lesson != null ? lesson.getTitle() : quiz.getTitle();
    }

    private static String normalize(String content) {
        String value = Objects.requireNonNull(content, "Comment content is required").strip();
        if (value.isEmpty() || value.length() > 2000) {
            throw new IllegalArgumentException("Comment must contain between 1 and 2000 characters");
        }
        return value;
    }
}
