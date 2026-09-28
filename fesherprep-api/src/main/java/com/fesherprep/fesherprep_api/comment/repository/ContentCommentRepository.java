package com.fesherprep.fesherprep_api.comment.repository;

import com.fesherprep.fesherprep_api.comment.domain.ContentComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContentCommentRepository extends JpaRepository<ContentComment, UUID> {
    @EntityGraph(attributePaths = {"author", "lesson", "quiz"})
    Page<ContentComment> findAllByLessonId(UUID lessonId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "lesson", "quiz"})
    Page<ContentComment> findAllByQuizId(UUID quizId, Pageable pageable);

    @EntityGraph(attributePaths = {"author", "lesson", "quiz"})
    Page<ContentComment> findAllByAuthorId(UUID authorId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"author", "lesson", "quiz"})
    Optional<ContentComment> findById(UUID id);
}
