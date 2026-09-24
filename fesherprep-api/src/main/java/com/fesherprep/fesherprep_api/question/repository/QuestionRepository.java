package com.fesherprep.fesherprep_api.question.repository;

import com.fesherprep.fesherprep_api.question.domain.Question;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    @Override
    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    Optional<Question> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    Page<Question> findAll(Pageable pageable);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    @Query("""
            select (count(item) > 0)
            from QuizFixedQuestion item
            where item.question.id = :questionId
            """)
    boolean isUsedByFixedQuiz(@Param("questionId") UUID questionId);
}
