package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.quiz.domain.QuizCategory;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.quiz.dto.PublishedQuizProjection;
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

    @Query(value = """
            select new com.fesherprep.fesherprep_api.quiz.dto.PublishedQuizProjection(
                quiz.id, quiz.code, quiz.title, quiz.type, quiz.selectionMode,
                quiz.passPercentage, quiz.language, quiz.category, quiz.maximumScore,
                quiz.durationSeconds,
                (select count(item.id) from QuizFixedQuestion item where item.quiz = quiz),
                (select coalesce(sum(rule.questionCount), 0) from QuizRule rule where rule.quiz = quiz)
            )
            from Quiz quiz
            where quiz.status = :status
              and (:language is null or quiz.language = :language)
              and (:category is null or quiz.category = :category)
            """, countQuery = """
            select count(quiz)
            from Quiz quiz
            where quiz.status = :status
              and (:language is null or quiz.language = :language)
              and (:category is null or quiz.category = :category)
            """)
    Page<PublishedQuizProjection> findPublishedFiltered(
            @Param("status") ContentStatus status,
            @Param("language") QuestionLanguage language,
            @Param("category") QuizCategory category,
            Pageable pageable
    );

    @Query("""
            select new com.fesherprep.fesherprep_api.quiz.dto.PublishedQuizProjection(
                quiz.id, quiz.code, quiz.title, quiz.type, quiz.selectionMode,
                quiz.passPercentage, quiz.language, quiz.category, quiz.maximumScore,
                quiz.durationSeconds,
                (select count(item.id) from QuizFixedQuestion item where item.quiz = quiz),
                (select coalesce(sum(rule.questionCount), 0) from QuizRule rule where rule.quiz = quiz)
            )
            from Quiz quiz
            where quiz.id = :id and quiz.status = :status
            """)
    Optional<PublishedQuizProjection> findPublishedProjectionByIdAndStatus(
            @Param("id") UUID id,
            @Param("status") ContentStatus status
    );

    @Query("""
            select new com.fesherprep.fesherprep_api.quiz.dto.PublishedQuizProjection(
                quiz.id, quiz.code, quiz.title, quiz.type, quiz.selectionMode,
                quiz.passPercentage, quiz.language, quiz.category, quiz.maximumScore,
                quiz.durationSeconds,
                (select count(item.id) from QuizFixedQuestion item where item.quiz = quiz),
                (select coalesce(sum(rule.questionCount), 0) from QuizRule rule where rule.quiz = quiz)
            )
            from Quiz quiz
            where quiz.code = :code and quiz.status = :status
            """)
    Optional<PublishedQuizProjection> findPublishedProjectionByCodeAndStatus(
            @Param("code") String code,
            @Param("status") ContentStatus status
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
