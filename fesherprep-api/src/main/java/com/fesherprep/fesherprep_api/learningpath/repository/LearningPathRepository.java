package com.fesherprep.fesherprep_api.learningpath.repository;

import com.fesherprep.fesherprep_api.learningpath.domain.LearningPath;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface LearningPathRepository extends JpaRepository<LearningPath, UUID> {
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

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);
}
