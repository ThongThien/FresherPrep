package com.fesherprep.fesherprep_api.lesson.repository;

import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    Optional<LessonProgress> findByUserIdAndLessonId(UUID userId, UUID lessonId);

    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    Optional<LessonProgress> findFirstByUserIdAndLessonId(UUID userId, UUID lessonId);

    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    Page<LessonProgress> findAllByUserId(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    List<LessonProgress> findAllByUserIdAndLessonIdIn(UUID userId, Collection<UUID> lessonIds);

    boolean existsByLessonId(UUID lessonId);

    long countByUserId(UUID userId);

    long countByUserIdAndReadQualifiedAtIsNotNull(UUID userId);
}
