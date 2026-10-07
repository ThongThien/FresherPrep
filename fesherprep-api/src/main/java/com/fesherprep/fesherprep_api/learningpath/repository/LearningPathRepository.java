package com.fesherprep.fesherprep_api.learningpath.repository;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPath;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.dto.ContentStatusCount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = "technology")
    @Query("select path from LearningPath path where path.id = :id")
    Optional<LearningPath> findByIdForUpdate(@Param("id") UUID id);

    @Override
    @EntityGraph(attributePaths = "technology")
    Optional<LearningPath> findById(UUID id);

    @EntityGraph(attributePaths = "technology")
    Optional<LearningPath> findByIdAndStatus(UUID id, ContentStatus status);

    @EntityGraph(attributePaths = "technology")
    Page<LearningPath> findAllByStatus(ContentStatus status, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = "technology")
    Page<LearningPath> findAll(Pageable pageable);

    @Query("select path.status as status, count(path.id) as total from LearningPath path group by path.status")
    List<ContentStatusCount> countByStatus();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
