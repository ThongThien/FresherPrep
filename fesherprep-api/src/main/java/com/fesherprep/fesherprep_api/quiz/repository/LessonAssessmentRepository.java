package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.LessonAssessment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LessonAssessmentRepository extends JpaRepository<LessonAssessment, UUID> {
    @EntityGraph(attributePaths = { "lesson", "quiz" })
    Optional<LessonAssessment> findByLessonId(UUID lessonId);

    @EntityGraph(attributePaths = { "lesson", "quiz" })
    List<LessonAssessment> findAllByLessonIdIn(Collection<UUID> lessonIds);

    @EntityGraph(attributePaths = { "lesson", "quiz" })
    List<LessonAssessment> findAllByQuizId(UUID quizId);

    boolean existsByLessonId(UUID lessonId);

    long deleteByLessonId(UUID lessonId);
}
