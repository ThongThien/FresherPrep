package com.fesherprep.fesherprep_api.knowledge.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.dto.*;
import com.fesherprep.fesherprep_api.knowledge.service.KnowledgeService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class KnowledgeController {
    private final KnowledgeService knowledgeService;

    @GetMapping
    public List<KnowledgeTreeNodeResponse> getPublishedTree() {
        return knowledgeService.getPublishedTree();
    }

    @GetMapping("/{nodeId}")
    public KnowledgeNodeResponse getPublishedNode(@PathVariable UUID nodeId) {
        return knowledgeService.getPublishedNode(nodeId);
    }

    @GetMapping("/by-slug/{slug}")
    public KnowledgeNodeResponse getPublishedNodeBySlug(@PathVariable String slug) {
        return knowledgeService.getPublishedNodeBySlug(slug);
    }

    @GetMapping("/nodes")
    public List<KnowledgeNodeResponse> getPublishedNodesByType(@RequestParam NodeType type) {
        return knowledgeService.getPublishedNodesByType(type);
    }

    @GetMapping("/{nodeId}/children")
    public List<KnowledgeNodeResponse> getPublishedChildren(@PathVariable UUID nodeId) {
        return knowledgeService.getPublishedChildren(nodeId);
    }

    @GetMapping("/admin/nodes")
    public List<KnowledgeNodeResponse> getAllNodes() {
        return knowledgeService.getAllNodes();
    }

    @GetMapping("/admin/nodes/{nodeId}")
    public KnowledgeNodeResponse getNode(@PathVariable UUID nodeId) {
        return knowledgeService.getNode(nodeId);
    }

    @PostMapping("/admin/nodes")
    public ResponseEntity<KnowledgeNodeResponse> createNode(
            @Valid @RequestBody CreateKnowledgeNodeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(knowledgeService.createNode(request));
    }

    @PutMapping("/admin/nodes/{nodeId}")
    public KnowledgeNodeResponse updateNode(
            @PathVariable UUID nodeId,
            @Valid @RequestBody UpdateKnowledgeNodeRequest request
    ) {
        return knowledgeService.updateNode(nodeId, request);
    }

    @PatchMapping("/admin/nodes/{nodeId}/status")
    public KnowledgeNodeResponse changeStatus(
            @PathVariable UUID nodeId,
            @Valid @RequestBody ChangeKnowledgeNodeStatusRequest request
    ) {
        return knowledgeService.changeStatus(nodeId, request);
    }

    @PostMapping("/admin/nodes/{nodeId}/publish")
    public KnowledgeNodeResponse publishNode(@PathVariable UUID nodeId) {
        return knowledgeService.publishNode(nodeId);
    }

    @PostMapping("/admin/nodes/{nodeId}/archive")
    public KnowledgeNodeResponse archiveNode(@PathVariable UUID nodeId) {
        return knowledgeService.archiveNode(nodeId);
    }

    @DeleteMapping("/admin/nodes/{nodeId}")
    public ResponseEntity<Void> deleteNode(@PathVariable UUID nodeId) {
        knowledgeService.deleteNode(nodeId);
        return ResponseEntity.noContent().build();
    }
}
