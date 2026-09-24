package com.fesherprep.fesherprep_api.learningpath.repository;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPathItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LearningPathItemRepository extends JpaRepository<LearningPathItem, UUID> {
    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    List<LearningPathItem> findAllByLearningPathIdOrderByDisplayOrderAsc(UUID learningPathId);

    @EntityGraph(attributePaths = { "lesson", "lesson.subtopic" })
    Optional<LearningPathItem> findByIdAndLearningPathId(UUID id, UUID learningPathId);

    boolean existsByLearningPathIdAndLessonId(UUID learningPathId, UUID lessonId);

    boolean existsByLearningPathIdAndDisplayOrder(UUID learningPathId, int displayOrder);

    boolean existsByLearningPathIdAndDisplayOrderAndIdNot(
            UUID learningPathId,
            int displayOrder,
            UUID id
    );

    long deleteAllByLearningPathId(UUID learningPathId);
}
