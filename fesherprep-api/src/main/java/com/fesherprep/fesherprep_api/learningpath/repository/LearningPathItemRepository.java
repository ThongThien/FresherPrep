package com.fesherprep.fesherprep_api.learningpath.repository;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPathItem;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("select max(item.displayOrder) from LearningPathItem item where item.learningPath.id = :pathId")
    Integer findMaxDisplayOrder(@Param("pathId") UUID pathId);

    @EntityGraph(attributePaths = { "learningPath", "lesson", "lesson.subtopic" })
    @Query("""
            select item from LearningPathItem item
            where item.lesson.id = :lessonId
              and item.learningPath.status = :status
              and exists (
                select membership.id from UserLearningPath membership
                where membership.user.id = :userId
                  and membership.learningPath = item.learningPath
              )
            order by item.displayOrder asc
            """)
    List<LearningPathItem> findJoinedPublishedPlacements(
            @Param("userId") UUID userId,
            @Param("lessonId") UUID lessonId,
            @Param("status") ContentStatus status
    );

    long deleteAllByLearningPathId(UUID learningPathId);
}
