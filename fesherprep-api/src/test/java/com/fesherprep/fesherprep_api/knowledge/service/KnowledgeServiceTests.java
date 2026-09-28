package com.fesherprep.fesherprep_api.knowledge.service;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KnowledgeServiceTests {
    @Mock
    private KnowledgeNodeRepository knowledgeNodeRepository;

    @Mock
    private ContentIdentityGenerator identityGenerator;

    @Test
    void deleteNodeDeletesTheEntireDescendantTree() {
        KnowledgeService service = new KnowledgeService(knowledgeNodeRepository, identityGenerator);
        UUID rootId = UUID.randomUUID();
        UUID childId = UUID.randomUUID();
        UUID grandchildId = UUID.randomUUID();

        KnowledgeNode root = mock(KnowledgeNode.class);
        KnowledgeNode child = mock(KnowledgeNode.class);
        KnowledgeNode grandchild = mock(KnowledgeNode.class);
        when(root.getStatus()).thenReturn(ContentStatus.DRAFT);
        when(child.getId()).thenReturn(childId);
        when(grandchild.getId()).thenReturn(grandchildId);
        when(knowledgeNodeRepository.findById(rootId)).thenReturn(Optional.of(root));
        when(knowledgeNodeRepository.findAllByParentIdOrderByDisplayOrderAscNameAsc(rootId))
                .thenReturn(List.of(child));
        when(knowledgeNodeRepository.findAllByParentIdOrderByDisplayOrderAscNameAsc(childId))
                .thenReturn(List.of(grandchild));
        when(knowledgeNodeRepository.findAllByParentIdOrderByDisplayOrderAscNameAsc(grandchildId))
                .thenReturn(List.of());

        service.deleteNode(rootId);

        verify(knowledgeNodeRepository).deleteAllByIdInBatch(List.of(rootId, childId, grandchildId));
        verify(knowledgeNodeRepository).flush();
    }

    @Test
    void deleteNodeStillRejectsPublishedRoot() {
        KnowledgeService service = new KnowledgeService(knowledgeNodeRepository, identityGenerator);
        UUID rootId = UUID.randomUUID();
        KnowledgeNode root = mock(KnowledgeNode.class);
        when(root.getStatus()).thenReturn(ContentStatus.PUBLISHED);
        when(knowledgeNodeRepository.findById(rootId)).thenReturn(Optional.of(root));

        assertThrows(IllegalStateException.class, () -> service.deleteNode(rootId));

        verify(knowledgeNodeRepository, never()).deleteAllByIdInBatch(any());
    }
}
