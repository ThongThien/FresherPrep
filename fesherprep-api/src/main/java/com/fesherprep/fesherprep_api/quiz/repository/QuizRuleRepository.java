package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.QuizRule;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

public interface QuizRuleRepository extends JpaRepository<QuizRule, UUID> {
    @EntityGraph(attributePaths = "knowledgeNode")
    List<QuizRule> findAllByQuizIdOrderByCreatedAtAsc(UUID quizId);

    @EntityGraph(attributePaths = {
            "quiz",
            "knowledgeNode",
            "knowledgeNode.parent",
            "knowledgeNode.parent.parent",
            "knowledgeNode.parent.parent.parent"
    })
    List<QuizRule> findAllByQuizIdIn(Collection<UUID> quizIds);

    Optional<QuizRule> findByIdAndQuizId(UUID id, UUID quizId);

    void deleteAllByQuizId(UUID quizId);
}
