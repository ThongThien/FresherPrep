package com.fesherprep.fesherprep_api.knowledge.service;

import java.util.UUID;

public class KnowledgeNodeNotFoundException extends RuntimeException {
    public KnowledgeNodeNotFoundException(UUID id) {
        super("Knowledge node does not exist: " + id);
    }

    public KnowledgeNodeNotFoundException(String slug) {
        super("Knowledge node does not exist: " + slug);
    }
}
