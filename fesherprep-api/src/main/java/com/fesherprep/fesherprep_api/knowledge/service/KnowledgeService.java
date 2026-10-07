package com.fesherprep.fesherprep_api.knowledge.service;

import com.fesherprep.fesherprep_api.config.CacheNames;
import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.dto.*;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
public class KnowledgeService {
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final ContentIdentityGenerator identityGenerator;

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.KNOWLEDGE_TREE, key = "'published'", sync = true)
    public List<KnowledgeTreeNodeResponse> getPublishedTree() {
        List<KnowledgeNode> nodes = knowledgeNodeRepository
                .findAllByStatusOrderByDisplayOrderAscNameAsc(ContentStatus.PUBLISHED);

        List<KnowledgeNode> roots = new ArrayList<>();
        Map<UUID, List<KnowledgeNode>> childrenByParent = new HashMap<>();
        for (KnowledgeNode node : nodes) {
            if (node.getParent() == null) {
                roots.add(node);
            } else {
                childrenByParent.computeIfAbsent(node.getParent().getId(), ignored -> new ArrayList<>())
                        .add(node);
            }
        }

        return roots.stream()
                .map(root -> toTree(root, childrenByParent))
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.KNOWLEDGE_NODE, key = "#id", sync = true)
    public KnowledgeNodeResponse getPublishedNode(UUID id) {
        return KnowledgeNodeResponse.from(
                knowledgeNodeRepository.findByIdAndStatus(id, ContentStatus.PUBLISHED)
                        .orElseThrow(() -> new KnowledgeNodeNotFoundException(id))
        );
    }

    @Transactional(readOnly = true)
    public KnowledgeNodeResponse getPublishedNodeBySlug(String slug) {
        String normalizedSlug = normalizeSlug(slug);
        return KnowledgeNodeResponse.from(
                knowledgeNodeRepository.findBySlugAndStatus(normalizedSlug, ContentStatus.PUBLISHED)
                        .orElseThrow(() -> new KnowledgeNodeNotFoundException(normalizedSlug))
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLISHED_KNOWLEDGE_NODES, key = "'type:' + #type.name()", sync = true)
    public List<KnowledgeNodeResponse> getPublishedNodesByType(NodeType type) {
        return knowledgeNodeRepository
                .findAllByTypeAndStatusOrderByDisplayOrderAscNameAsc(
                        Objects.requireNonNull(type, "Node type is required"),
                        ContentStatus.PUBLISHED
                )
                .stream()
                .map(KnowledgeNodeResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.PUBLISHED_KNOWLEDGE_NODES, key = "'children:' + #parentId", sync = true)
    public List<KnowledgeNodeResponse> getPublishedChildren(UUID parentId) {
        requirePublished(parentId);
        return knowledgeNodeRepository
                .findAllByParentIdAndStatusOrderByDisplayOrderAscNameAsc(
                        parentId,
                        ContentStatus.PUBLISHED
                )
                .stream()
                .map(KnowledgeNodeResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.ADMIN_KNOWLEDGE_NODES, key = "'all'", sync = true)
    public List<KnowledgeNodeResponse> getAllNodes() {
        return knowledgeNodeRepository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(KnowledgeNodeResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public KnowledgeNodeResponse getNode(UUID id) {
        return KnowledgeNodeResponse.from(requireNode(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public KnowledgeNodeResponse createNode(@Valid CreateKnowledgeNodeRequest request) {
        String slug = generateUniqueSlug(request.name());
        KnowledgeNode parent = resolveParent(request.parentId());

        KnowledgeNode node = new KnowledgeNode(
                request.type(),
                request.name(),
                slug,
                parent,
                request.displayOrder()
        );
        KnowledgeNode saved = save(node, slug);
        if (request.publish()) {
            validatePublish(saved);
            publish(saved);
        }
        return KnowledgeNodeResponse.from(saved);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public KnowledgeNodeResponse updateNode(UUID id, @Valid UpdateKnowledgeNodeRequest request) {
        KnowledgeNode node = requireNode(id);
        String slug = node.getSlug();
        KnowledgeNode parent = resolveParent(request.parentId());

        validateChildrenForType(node, request.type());
        validatePublishedPlacement(node, parent);
        node.changePlacement(request.type(), parent);
        node.updateDetails(request.name(), slug, request.displayOrder());

        return KnowledgeNodeResponse.from(save(node, slug));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public KnowledgeNodeResponse changeStatus(
            UUID id,
            @Valid ChangeKnowledgeNodeStatusRequest request
    ) {
        KnowledgeNode node = requireNode(id);
        ContentStatus target = request.status();

        if (target == ContentStatus.PUBLISHED) {
            validatePublish(node);
            publish(node);
            return KnowledgeNodeResponse.from(node);
        }
        if (target == ContentStatus.ARCHIVED
                && knowledgeNodeRepository.existsByParentIdAndStatus(id, ContentStatus.PUBLISHED)) {
            throw new IllegalStateException("Archive published child nodes first");
        }

        node.changeStatus(target);
        return KnowledgeNodeResponse.from(node);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public KnowledgeNodeResponse publishNode(UUID id) {
        return changeStatus(id, new ChangeKnowledgeNodeStatusRequest(ContentStatus.PUBLISHED));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public KnowledgeNodeResponse archiveNode(UUID id) {
        return changeStatus(id, new ChangeKnowledgeNodeStatusRequest(ContentStatus.ARCHIVED));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.KNOWLEDGE_TREE, CacheNames.KNOWLEDGE_NODE,
            CacheNames.PUBLISHED_KNOWLEDGE_NODES, CacheNames.ADMIN_KNOWLEDGE_NODES,
            CacheNames.ADMIN_LESSON_TREE, CacheNames.QUIZ_CATALOG,
            CacheNames.ADMIN_DASHBOARD }, allEntries = true)
    public void deleteNode(UUID id) {
        KnowledgeNode node = requireNode(id);
        if (node.getStatus() != ContentStatus.DRAFT && node.getStatus() != ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Only draft or archived nodes can be deleted");
        }
        knowledgeNodeRepository.deleteAllByIdInBatch(collectSubtreeIds(id));
        knowledgeNodeRepository.flush();
    }

    private List<UUID> collectSubtreeIds(UUID rootId) {
        List<UUID> subtreeIds = new ArrayList<>();
        Deque<UUID> pending = new ArrayDeque<>();
        pending.add(rootId);

        while (!pending.isEmpty()) {
            UUID currentId = pending.removeFirst();
            subtreeIds.add(currentId);
            knowledgeNodeRepository.findAllByParentIdOrderByDisplayOrderAscNameAsc(currentId)
                    .stream()
                    .map(KnowledgeNode::getId)
                    .forEach(pending::addLast);
        }

        return subtreeIds;
    }

    private KnowledgeNode requirePublished(UUID id) {
        return knowledgeNodeRepository.findByIdAndStatus(id, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new KnowledgeNodeNotFoundException(id));
    }

    private KnowledgeNode requireNode(UUID id) {
        return knowledgeNodeRepository.findById(id)
                .orElseThrow(() -> new KnowledgeNodeNotFoundException(id));
    }

    private KnowledgeNode resolveParent(UUID parentId) {
        return parentId == null ? null : requireNode(parentId);
    }

    private void validateChildrenForType(KnowledgeNode node, NodeType newType) {
        boolean invalidChild = knowledgeNodeRepository
                .findAllByParentIdOrderByDisplayOrderAscNameAsc(node.getId())
                .stream()
                .anyMatch(child -> !newType.canParent(child.getType()));
        if (invalidChild) {
            throw new IllegalArgumentException("The selected node type is incompatible with existing children");
        }
    }

    private static void validatePublishedPlacement(KnowledgeNode node, KnowledgeNode parent) {
        if (node.getStatus() == ContentStatus.PUBLISHED
                && parent != null
                && parent.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published node requires a published parent");
        }
    }

    private static void validatePublish(KnowledgeNode node) {
        if (node.getParent() != null && node.getParent().getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Publish the parent node first");
        }
    }

    /**
     * Knowledge publishing is an ADMIN operation. The UI exposes Publish as one
     * action, while the shared content lifecycle deliberately requires review
     * before publication. Advance through those valid states internally instead
     * of weakening the lifecycle rules used by lessons, questions, and quizzes.
     */
    private static void publish(KnowledgeNode node) {
        if (node.getStatus() == ContentStatus.PUBLISHED) {
            return;
        }
        if (node.getStatus() == ContentStatus.ARCHIVED) {
            node.changeStatus(ContentStatus.DRAFT);
        }
        if (node.getStatus() == ContentStatus.DRAFT) {
            node.changeStatus(ContentStatus.REVIEW);
        }
        node.changeStatus(ContentStatus.PUBLISHED);
    }

    private String generateUniqueSlug(String name) {
        for (int attempt = 0; attempt < 20; attempt++) {
            String slug = identityGenerator.slug(name, 180);
            if (!knowledgeNodeRepository.existsBySlug(slug)) return slug;
        }
        throw new IllegalStateException("Could not generate a unique knowledge slug");
    }

    private KnowledgeNode save(KnowledgeNode node, String slug) {
        try {
            return knowledgeNodeRepository.saveAndFlush(node);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateKnowledgeSlugException(slug);
        }
    }

    private KnowledgeTreeNodeResponse toTree(
            KnowledgeNode node,
            Map<UUID, List<KnowledgeNode>> childrenByParent
    ) {
        List<KnowledgeTreeNodeResponse> children = childrenByParent
                .getOrDefault(node.getId(), List.of())
                .stream()
                .map(child -> toTree(child, childrenByParent))
                .toList();

        return new KnowledgeTreeNodeResponse(
                node.getId(),
                node.getType(),
                node.getName(),
                node.getSlug(),
                node.getDisplayOrder(),
                children
        );
    }

    private static String normalizeSlug(String slug) {
        return Objects.requireNonNull(slug, "Slug is required")
                .strip()
                .toLowerCase(Locale.ROOT);
    }
}
