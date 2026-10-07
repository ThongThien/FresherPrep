package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.QuizFixedQuestion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;

public interface QuizFixedQuestionRepository extends JpaRepository<QuizFixedQuestion, UUID> {
    @EntityGraph(attributePaths = { "question", "question.subtopic", "question.publishedVersion" })
    List<QuizFixedQuestion> findAllByQuizIdOrderByPositionAsc(UUID quizId);

    @EntityGraph(attributePaths = {
            "quiz",
            "question",
            "question.subtopic",
            "question.subtopic.parent",
            "question.subtopic.parent.parent",
            "question.subtopic.parent.parent.parent"
    })
    List<QuizFixedQuestion> findAllByQuizIdIn(Collection<UUID> quizIds);

    Optional<QuizFixedQuestion> findByQuizIdAndQuestionId(UUID quizId, UUID questionId);

    void deleteAllByQuizId(UUID quizId);
}
