package com.fesherprep.fesherprep_api.question.repository;

import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.dto.ContentStatusCount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionRepository extends JpaRepository<Question, UUID> {
    @Override
    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    Optional<Question> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    Page<Question> findAll(Pageable pageable);

    @Query("select question.status as status, count(question.id) as total from Question question group by question.status")
    List<ContentStatusCount> countByStatus();

    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    @Query("""
            select question
            from Question question
            where (:language is null or question.language = :language)
              and (:category is null or question.category = :category)
              and (:technologyId is null or question.subtopic.parent.parent.parent.id = :technologyId)
              and (:categoryNodeId is null or question.subtopic.parent.parent.id = :categoryNodeId)
              and (:topicId is null or question.subtopic.parent.id = :topicId)
              and (:subtopicId is null or question.subtopic.id = :subtopicId)
              and (:difficulty is null or question.difficulty = :difficulty)
              and (:status is null or question.status = :status)
              and (
                :query = ''
                or lower(question.code) like lower(concat('%', :query, '%'))
                or exists (
                  select version.id from QuestionVersion version
                  where version.question = question
                    and lower(version.content) like lower(concat('%', :query, '%'))
                )
              )
            """)
    Page<Question> findAllFiltered(
            @Param("language") QuestionLanguage language,
            @Param("category") QuestionCategory category,
            @Param("technologyId") UUID technologyId,
            @Param("categoryNodeId") UUID categoryNodeId,
            @Param("topicId") UUID topicId,
            @Param("subtopicId") UUID subtopicId,
            @Param("difficulty") Difficulty difficulty,
            @Param("status") ContentStatus status,
            @Param("query") String query,
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
