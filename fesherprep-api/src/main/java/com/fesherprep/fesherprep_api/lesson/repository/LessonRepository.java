package com.fesherprep.fesherprep_api.lesson.repository;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    @EntityGraph(attributePaths = "subtopic")
    Optional<Lesson> findByIdAndStatus(UUID id, ContentStatus status);

    @EntityGraph(attributePaths = "subtopic")
    Optional<Lesson> findBySlugAndStatus(String slug, ContentStatus status);

    @EntityGraph(attributePaths = "subtopic")
    Page<Lesson> findAllBySubtopicIdAndStatus(
            UUID subtopicId,
            ContentStatus status,
            Pageable pageable
    );

    @Override
    @EntityGraph(attributePaths = "subtopic")
    Page<Lesson> findAll(Pageable pageable);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
