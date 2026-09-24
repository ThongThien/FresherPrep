package com.fesherprep.fesherprep_api.lesson.repository;

import com.fesherprep.fesherprep_api.lesson.domain.LessonPrerequisite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LessonPrerequisiteRepository extends JpaRepository<LessonPrerequisite, UUID> {
    @Query("""
            select relationship
            from LessonPrerequisite relationship
            join fetch relationship.prerequisiteLesson prerequisite
            join fetch prerequisite.subtopic
            where relationship.lesson.id = :lessonId
            order by prerequisite.displayOrder asc, prerequisite.title asc
            """)
    List<LessonPrerequisite> findAllForLesson(@Param("lessonId") UUID lessonId);

    @EntityGraph(attributePaths = { "lesson", "prerequisiteLesson" })
    @Query("select relationship from LessonPrerequisite relationship")
    List<LessonPrerequisite> findAllWithLessons();

    @EntityGraph(attributePaths = "lesson")
    List<LessonPrerequisite> findAllByPrerequisiteLessonId(UUID prerequisiteLessonId);

    boolean existsByLessonIdAndPrerequisiteLessonId(UUID lessonId, UUID prerequisiteLessonId);

    boolean existsByLessonIdOrPrerequisiteLessonId(UUID lessonId, UUID prerequisiteLessonId);

    long deleteByLessonIdAndPrerequisiteLessonId(UUID lessonId, UUID prerequisiteLessonId);
}
