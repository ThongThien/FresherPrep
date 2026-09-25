package com.fesherprep.fesherprep_api.question.repository;

import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
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

    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    @Query("""
            select question
            from Question question
            where (:language is null or question.language = :language)
              and (:category is null or question.category = :category)
              and (:knowledgeNodeId is null or question.subtopic.id = :knowledgeNodeId)
              and (:difficulty is null or question.difficulty = :difficulty)
              and (:status is null or question.status = :status)
            """)
    Page<Question> findAllFiltered(
            @Param("language") QuestionLanguage language,
            @Param("category") QuestionCategory category,
            @Param("knowledgeNodeId") UUID knowledgeNodeId,
            @Param("difficulty") Difficulty difficulty,
            @Param("status") ContentStatus status,
            Pageable pageable
    );

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    @Query("""
            select (count(item) > 0)
            from QuizFixedQuestion item
            where item.question.id = :questionId
            """)
    boolean isUsedByFixedQuiz(@Param("questionId") UUID questionId);
}
