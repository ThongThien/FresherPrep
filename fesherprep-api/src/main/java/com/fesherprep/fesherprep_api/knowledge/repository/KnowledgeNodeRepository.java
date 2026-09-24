package com.fesherprep.fesherprep_api.knowledge.repository;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, UUID> {
    @EntityGraph(attributePaths = "parent")
    Optional<KnowledgeNode> findByIdAndStatus(UUID id, ContentStatus status);

    @EntityGraph(attributePaths = "parent")
    Optional<KnowledgeNode> findBySlugAndStatus(String slug, ContentStatus status);

    @EntityGraph(attributePaths = "parent")
    List<KnowledgeNode> findAllByStatusOrderByDisplayOrderAscNameAsc(ContentStatus status);

    @EntityGraph(attributePaths = "parent")
    List<KnowledgeNode> findAllByTypeAndStatusOrderByDisplayOrderAscNameAsc(
            NodeType type,
            ContentStatus status
    );

    @EntityGraph(attributePaths = "parent")
    List<KnowledgeNode> findAllByParentIdAndStatusOrderByDisplayOrderAscNameAsc(
            UUID parentId,
            ContentStatus status
    );

    @EntityGraph(attributePaths = "parent")
    List<KnowledgeNode> findAllByParentIdOrderByDisplayOrderAscNameAsc(UUID parentId);

    @EntityGraph(attributePaths = "parent")
    List<KnowledgeNode> findAllByOrderByDisplayOrderAscNameAsc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    boolean existsByParentId(UUID parentId);

    boolean existsByParentIdAndStatus(UUID parentId, ContentStatus status);
}
