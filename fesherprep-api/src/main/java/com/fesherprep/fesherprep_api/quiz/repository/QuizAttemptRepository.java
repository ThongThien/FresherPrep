package com.fesherprep.fesherprep_api.quiz.repository;

import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;
import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {
    Optional<QuizAttempt> findByIdAndUserId(UUID id, UUID userId);

    Optional<QuizAttempt> findFirstByUserIdAndQuizIdAndStatusOrderByCreatedAtDesc(
            UUID userId, UUID quizId, AttemptStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select attempt from QuizAttempt attempt where attempt.id = :id and attempt.user.id = :userId")
    Optional<QuizAttempt> findOwnedForUpdate(
            @Param("id") UUID id,
            @Param("userId") UUID userId
    );

    @EntityGraph(attributePaths = "quiz")
    Page<QuizAttempt> findAllByUserId(UUID userId, Pageable pageable);

    List<QuizAttempt> findAllByUserIdAndQuizIdOrderByCreatedAtDesc(UUID userId, UUID quizId);

    @EntityGraph(attributePaths = "quiz")
    List<QuizAttempt> findAllByUserIdAndQuizIdIn(UUID userId, Collection<UUID> quizIds);

    boolean existsByQuizId(UUID quizId);
}
