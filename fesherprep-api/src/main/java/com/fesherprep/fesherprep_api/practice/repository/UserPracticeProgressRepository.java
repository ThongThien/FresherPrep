package com.fesherprep.fesherprep_api.practice.repository;

import com.fesherprep.fesherprep_api.practice.domain.UserPracticeProgress;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface UserPracticeProgressRepository extends JpaRepository<UserPracticeProgress, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select progress from UserPracticeProgress progress where progress.user.id = :userId and progress.exercise.id = :exerciseId")
    Optional<UserPracticeProgress> findForUpdate(@Param("userId") UUID userId, @Param("exerciseId") UUID exerciseId);

    @Query("select progress.exercise.id from UserPracticeProgress progress where progress.user.id = :userId and progress.completedAt is not null")
    Set<UUID> findCompletedExerciseIds(@Param("userId") UUID userId);
}

