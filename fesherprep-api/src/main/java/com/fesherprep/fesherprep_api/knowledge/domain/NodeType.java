package com.fesherprep.fesherprep_api.knowledge.domain;

public enum NodeType {
    TECHNOLOGY,
    CATEGORY,
    TOPIC,
    SUBTOPIC;

    public boolean canParent(NodeType childType) {
        return compareTo(childType) < 0;
    }
}
