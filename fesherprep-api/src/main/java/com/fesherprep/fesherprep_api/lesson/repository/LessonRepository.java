package com.fesherprep.fesherprep_api.lesson.repository;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface LessonRepository extends JpaRepository<Lesson, UUID> {
    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    Optional<Lesson> findByIdAndStatus(UUID id, ContentStatus status);

    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    Optional<Lesson> findBySlugAndStatus(String slug, ContentStatus status);

    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    Page<Lesson> findAllBySubtopicIdAndStatus(
            UUID subtopicId,
            ContentStatus status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    @Query("""
            select lesson
            from Lesson lesson
            where lesson.status = :lessonStatus
              and lesson.subtopic.status = :subtopicStatus
              and (
                :query = ''
                or lower(lesson.title) like lower(concat('%', :query, '%'))
                or lower(lesson.slug) like lower(concat('%', :query, '%'))
              )
            """)
    Page<Lesson> findPublishedLessons(
            @Param("lessonStatus") ContentStatus lessonStatus,
            @Param("subtopicStatus") ContentStatus subtopicStatus,
            @Param("query") String query,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    Page<Lesson> findAllBySubtopicId(UUID subtopicId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"subtopic", "subtopic.parent"})
    Page<Lesson> findAll(Pageable pageable);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
