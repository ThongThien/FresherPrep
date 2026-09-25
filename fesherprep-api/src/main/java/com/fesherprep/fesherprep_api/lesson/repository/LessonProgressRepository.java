package com.fesherprep.fesherprep_api.lesson.repository;

import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            select count(progress)
            from LessonProgress progress
            where progress.user.id = :userId
              and progress.readQualifiedAt is not null
              and (
                not exists (
                    select assessment.id
                    from LessonAssessment assessment
                    where assessment.lesson.id = progress.lesson.id
                )
                or exists (
                    select attempt.id
                    from QuizAttempt attempt, LessonAssessment assessment
                    where assessment.lesson.id = progress.lesson.id
                      and attempt.user.id = :userId
                      and attempt.quiz.id = assessment.quiz.id
                      and attempt.status = com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus.SUBMITTED
                      and attempt.scorePercentage >= attempt.passPercentage
                )
              )
            """)
    long countCompletedByUserId(@Param("userId") UUID userId);
}
