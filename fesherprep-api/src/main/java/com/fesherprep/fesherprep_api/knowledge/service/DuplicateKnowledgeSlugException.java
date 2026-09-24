package com.fesherprep.fesherprep_api.knowledge.service;

public class DuplicateKnowledgeSlugException extends RuntimeException {
    public DuplicateKnowledgeSlugException(String slug) {
        super("Knowledge node slug already exists: " + slug);
    }
}
