package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.QuizFixedQuestion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizFixedQuestionRepository extends JpaRepository<QuizFixedQuestion, UUID> {
    @EntityGraph(attributePaths = { "question", "question.subtopic", "question.publishedVersion" })
    List<QuizFixedQuestion> findAllByQuizIdOrderByPositionAsc(UUID quizId);

    Optional<QuizFixedQuestion> findByQuizIdAndQuestionId(UUID quizId, UUID questionId);

    void deleteAllByQuizId(UUID quizId);
}
