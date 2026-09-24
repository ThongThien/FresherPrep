package com.fesherprep.fesherprep_api.lesson.domain;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.learningpath.domain.LearningPath;
import com.fesherprep.fesherprep_api.learningpath.domain.LearningPathItem;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.user.domain.User;
import java.time.Instant;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LearningModelTests {

    private static final Instant START = Instant.parse("2026-09-23T00:00:00Z");

    @Test
    void readingRequiresBothTimeAndScrollAndKeepsFirstQualificationTime() {
        LessonProgress progress = progress();

        progress.recordReading(15, 90, START.plusSeconds(15));
        assertNull(progress.getReadQualifiedAt(), "Scroll alone is insufficient");

        progress.recordReading(15, 20, START.plusSeconds(30));
        assertEquals(START.plusSeconds(30), progress.getReadQualifiedAt());
        assertEquals(90, progress.getMaxScrollPercent(), "Scrolling back must preserve the highest position");

        progress.recordReading(10, 100, START.plusSeconds(40));
        assertEquals(START.plusSeconds(30), progress.getReadQualifiedAt());
        assertEquals(40, progress.getActiveSeconds());
    }

    @Test
    void enoughTimeWithoutRequiredScrollDoesNotQualifyReading() {
        LessonProgress progress = progress();

        progress.recordReading(60, 50, START.plusSeconds(60));

        assertNull(progress.getReadQualifiedAt());
    }

    @Test
    void heartbeatRejectsInflatedTimeAndOutOfOrderEvents() {
        LessonProgress progress = progress();

        assertThrows(IllegalArgumentException.class,
                () -> progress.recordReading(600, 100, START.plusSeconds(15)));
        assertEquals(0, progress.getActiveSeconds());
        assertNull(progress.getReadQualifiedAt());

        progress.recordReading(10, 10, START.plusSeconds(15));
        assertThrows(IllegalArgumentException.class,
                () -> progress.recordReading(1, 100, START.plusSeconds(14)));
        assertEquals(10, progress.getActiveSeconds());
    }

    @Test
    void knowledgeTreeRejectsInvalidParentAndCycle() {
        KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Java", "java", null, 0);
        KnowledgeNode category = new KnowledgeNode(NodeType.CATEGORY, "Core", "java-core", technology, 0);

        assertThrows(IllegalArgumentException.class,
                () -> new KnowledgeNode(NodeType.CATEGORY, "Nested core", "nested-core", category, 0));
        assertThrows(IllegalArgumentException.class, () -> technology.moveTo(category));
        assertThrows(IllegalArgumentException.class, () -> category.moveTo(category));
    }

    @Test
    void knowledgeTreeCanSkipCategoryAndTopicLevels() {
        KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Java", "java", null, 0);
        KnowledgeNode topic = new KnowledgeNode(NodeType.TOPIC, "Collections", "collections", technology, 0);
        KnowledgeNode subtopic = new KnowledgeNode(NodeType.SUBTOPIC, "HashMap", "hashmap", technology, 0);

        assertEquals(technology, topic.getParent());
        assertEquals(technology, subtopic.getParent());
        subtopic.moveTo(topic);
        assertEquals(topic, subtopic.getParent());
        assertThrows(IllegalArgumentException.class, () -> topic.moveTo(subtopic));
    }

    @Test
    void learningContentRequiresReviewBeforePublication() {
        KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Java", "java", null, 0);
        Lesson lesson = lesson();
        LearningPath path = new LearningPath("Java learning", "java-learning", technology);

        assertThrows(IllegalStateException.class, () -> technology.changeStatus(ContentStatus.PUBLISHED));
        assertThrows(IllegalStateException.class, () -> lesson.changeStatus(ContentStatus.PUBLISHED));
        assertThrows(IllegalStateException.class, () -> path.changeStatus(ContentStatus.PUBLISHED));

        lesson.changeStatus(ContentStatus.REVIEW);
        lesson.changeStatus(ContentStatus.PUBLISHED);
        lesson.changeStatus(ContentStatus.ARCHIVED);
        lesson.changeStatus(ContentStatus.DRAFT);
        lesson.changeStatus(ContentStatus.REVIEW);
        lesson.changeStatus(ContentStatus.DRAFT);
        assertEquals(ContentStatus.DRAFT, lesson.getStatus());
    }

    @Test
    void lessonCannotBeItsOwnPrerequisite() {
        Lesson lesson = lesson();

        assertThrows(IllegalArgumentException.class, () -> new LessonPrerequisite(lesson, lesson));
    }

    @Test
    void learningPathRejectsLessonFromAnotherTechnology() {
        KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Python", "python", null, 0);
        LearningPath path = new LearningPath("Python learning", "python-learning", technology);

        assertThrows(IllegalArgumentException.class,
                () -> new LearningPathItem(path, lesson(), 0, true, 1));
    }

    private LessonProgress progress() {
        User user = new User("intern@example.com", "already-encoded-password", "Intern");
        return new LessonProgress(user, lesson(), START);
    }

    private Lesson lesson() {
        KnowledgeNode technology = new KnowledgeNode(NodeType.TECHNOLOGY, "Java", "java", null, 0);
        KnowledgeNode category = new KnowledgeNode(NodeType.CATEGORY, "Core", "java-core", technology, 0);
        KnowledgeNode topic = new KnowledgeNode(NodeType.TOPIC, "Collections", "collections", category, 0);
        KnowledgeNode subtopic = new KnowledgeNode(NodeType.SUBTOPIC, "HashMap", "hashmap", topic, 0);
        return new Lesson(subtopic, "HashMap basics", "hashmap-basics", "Lesson content", 0, 30, 80);
    }
}
