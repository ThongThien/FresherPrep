package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface QuizQuestionSelectionRepository extends Repository<Question, UUID> {
    @EntityGraph(attributePaths = { "subtopic", "publishedVersion" })
    Optional<Question> findById(UUID id);

    @EntityGraph(attributePaths = { "subtopic", "publishedVersion", "publishedVersion.options" })
    @Query("""
            select distinct question
            from Question question
            where question.status = :status
              and question.publishedVersion is not null
              and question.subtopic.status = :status
              and question.subtopic.id in :subtopicIds
              and (:difficulty is null or question.difficulty = :difficulty)
            """)
    List<Question> findEligibleQuestions(
            @Param("subtopicIds") Set<UUID> subtopicIds,
            @Param("difficulty") Difficulty difficulty,
            @Param("status") ContentStatus status
    );
}
