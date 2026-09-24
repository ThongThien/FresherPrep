package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface QuizRepository extends JpaRepository<Quiz, UUID> {
    Optional<Quiz> findByIdAndStatus(UUID id, ContentStatus status);

    Optional<Quiz> findByCodeAndStatus(String code, ContentStatus status);

    Page<Quiz> findAllByStatus(ContentStatus status, Pageable pageable);

    @Override
    Page<Quiz> findAll(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select quiz from Quiz quiz where quiz.id = :id and quiz.status = :status")
    Optional<Quiz> findForStart(
            @Param("id") UUID id,
            @Param("status") ContentStatus status
    );

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    @Query("select (count(assessment) > 0) from LessonAssessment assessment where assessment.quiz.id = :quizId")
    boolean isUsedByLessonAssessment(@Param("quizId") UUID quizId);
}
