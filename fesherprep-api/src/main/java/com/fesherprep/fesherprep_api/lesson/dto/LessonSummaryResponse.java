package com.fesherprep.fesherprep_api.lesson.dto;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.util.UUID;

public record LessonSummaryResponse(
        UUID id,
        UUID subtopicId,
        UUID topicId,
        String topicName,
        String subtopicName,
        String title,
        String slug,
        ContentStatus status,
        int displayOrder,
        int minimumReadSeconds,
        int requiredScrollPercent
) {
    public static LessonSummaryResponse from(Lesson lesson) {
        KnowledgeNode topic = findTopic(lesson.getSubtopic());
        return new LessonSummaryResponse(
                lesson.getId(),
                lesson.getSubtopic().getId(),
                topic == null ? null : topic.getId(),
                topic == null ? "Other" : topic.getName(),
                lesson.getSubtopic().getName(),
                lesson.getTitle(),
                lesson.getSlug(),
                lesson.getStatus(),
                lesson.getDisplayOrder(),
                lesson.getMinimumReadSeconds(),
                lesson.getRequiredScrollPercent()
        );
    }

    private static KnowledgeNode findTopic(KnowledgeNode subtopic) {
        KnowledgeNode current = subtopic.getParent();
        while (current != null && current.getType() != NodeType.TOPIC) {
            current = current.getParent();
        }
        return current;
    }
}
