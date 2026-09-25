package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;
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

    @Query("""
            select quiz from Quiz quiz
            where quiz.status = :status
              and (:language is null or quiz.language = :language)
              and (:category is null or quiz.category = :category)
            """)
    Page<Quiz> findPublishedFiltered(
            @Param("status") ContentStatus status,
            @Param("language") QuestionLanguage language,
            @Param("category") QuizCategory category,
            Pageable pageable
    );

    @Override
    Page<Quiz> findAll(Pageable pageable);

    @Query("""
            select quiz from Quiz quiz
            where (:language is null or quiz.language = :language)
              and (:category is null or quiz.category = :category)
              and (:status is null or quiz.status = :status)
            """)
    Page<Quiz> findAllFiltered(
            @Param("language") QuestionLanguage language,
            @Param("category") QuizCategory category,
            @Param("status") ContentStatus status,
            Pageable pageable
    );

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
