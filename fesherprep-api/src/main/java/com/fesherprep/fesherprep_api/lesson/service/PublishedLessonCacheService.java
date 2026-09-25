package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.config.CacheNames;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.domain.LessonPrerequisite;
import com.fesherprep.fesherprep_api.lesson.dto.LessonDetailResponse;
import com.fesherprep.fesherprep_api.lesson.dto.LessonSummaryResponse;
import com.fesherprep.fesherprep_api.lesson.repository.LessonPrerequisiteRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PublishedLessonCacheService {
    private final LessonRepository lessonRepository;
    private final LessonPrerequisiteRepository prerequisiteRepository;

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.LESSON_DETAIL, key = "#lessonId", sync = true)
    public LessonDetailResponse get(UUID lessonId) {
        Lesson lesson = lessonRepository.findByIdAndStatus(lessonId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LessonNotFoundException(lessonId));
        if (lesson.getSubtopic().getStatus() != ContentStatus.PUBLISHED
                || lesson.getSubtopic().getType() != NodeType.SUBTOPIC) {
            throw new LessonNotFoundException(lessonId);
        }
        List<LessonSummaryResponse> prerequisites = prerequisiteRepository.findAllForLesson(lessonId)
                .stream()
                .map(LessonPrerequisite::getPrerequisiteLesson)
                .filter(candidate -> candidate.getStatus() == ContentStatus.PUBLISHED
                        && candidate.getSubtopic().getStatus() == ContentStatus.PUBLISHED)
                .map(LessonSummaryResponse::from)
                .toList();
        return LessonDetailResponse.from(lesson, prerequisites);
    }
}
