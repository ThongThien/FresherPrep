package com.fesherprep.fesherprep_api.question.repository;

import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionVersionRepository extends JpaRepository<QuestionVersion, UUID> {
    @Override
    @EntityGraph(attributePaths = { "question", "question.subtopic", "options" })
    Optional<QuestionVersion> findById(UUID id);

    @EntityGraph(attributePaths = { "question", "question.subtopic", "options" })
    Optional<QuestionVersion> findByIdAndQuestionId(UUID id, UUID questionId);

    @EntityGraph(attributePaths = "options")
    List<QuestionVersion> findAllByQuestionIdOrderByVersionNumberDesc(UUID questionId);

    @Query("select coalesce(max(version.versionNumber), 0) from QuestionVersion version where version.question.id = :questionId")
    int findMaxVersionNumber(@Param("questionId") UUID questionId);

    boolean existsByQuestionIdAndVersionNumber(UUID questionId, int versionNumber);

    boolean existsByQuestionId(UUID questionId);

    @Query("""
            select (count(attemptQuestion) > 0)
            from QuizAttemptQuestion attemptQuestion
            where attemptQuestion.questionVersion.id = :versionId
            """)
    boolean isUsedByAttempt(@Param("versionId") UUID versionId);
}
