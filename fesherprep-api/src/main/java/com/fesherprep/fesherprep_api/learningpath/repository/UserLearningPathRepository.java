package com.fesherprep.fesherprep_api.learningpath.repository;

import com.fesherprep.fesherprep_api.learningpath.domain.UserLearningPath;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserLearningPathRepository extends JpaRepository<UserLearningPath, UUID> {
    boolean existsByUserIdAndLearningPathId(UUID userId, UUID learningPathId);

    @EntityGraph(attributePaths = { "learningPath", "learningPath.technology" })
    Page<UserLearningPath> findAllByUserIdAndLearningPathStatus(
            UUID userId,
            ContentStatus status,
            Pageable pageable
    );

    boolean existsByLearningPathId(UUID learningPathId);

    long countByUserId(UUID userId);
}
