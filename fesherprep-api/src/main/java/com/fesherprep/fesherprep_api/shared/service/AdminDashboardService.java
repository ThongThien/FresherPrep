package com.fesherprep.fesherprep_api.shared.service;

import com.fesherprep.fesherprep_api.config.CacheNames;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.learningpath.repository.LearningPathRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.question.repository.QuestionRepository;
import com.fesherprep.fesherprep_api.quiz.repository.QuizRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.dto.AdminDashboardResponse;
import com.fesherprep.fesherprep_api.shared.dto.ContentStatusCount;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final QuizRepository quizRepository;
    private final LearningPathRepository learningPathRepository;
    private final LessonRepository lessonRepository;
    private final QuestionRepository questionRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.ADMIN_DASHBOARD, key = "'content'", sync = true)
    public AdminDashboardResponse getContentSummary() {
        List<AdminDashboardResponse.Metric> metrics = new ArrayList<>();
        EnumMap<ContentStatus, Long> totals = emptyStatusTotals();

        addMetric(metrics, totals, "quizzes", "Quizzes", quizRepository.countByStatus());
        addMetric(metrics, totals, "learningPaths", "Learning paths", learningPathRepository.countByStatus());
        addMetric(metrics, totals, "lessons", "Lessons", lessonRepository.countByStatus());
        addMetric(metrics, totals, "questions", "Questions", questionRepository.countByStatus());
        addMetric(metrics, totals, "knowledge", "Knowledge nodes", knowledgeNodeRepository.countByStatus());

        return new AdminDashboardResponse(List.copyOf(metrics), Map.copyOf(totals), List.of());
    }

    private static void addMetric(
            List<AdminDashboardResponse.Metric> metrics,
            EnumMap<ContentStatus, Long> totals,
            String key,
            String label,
            List<ContentStatusCount> counts
    ) {
        long metricTotal = 0;
        for (ContentStatusCount count : counts) {
            metricTotal += count.getTotal();
            totals.merge(count.getStatus(), count.getTotal(), Long::sum);
        }
        metrics.add(new AdminDashboardResponse.Metric(key, label, metricTotal));
    }

    private static EnumMap<ContentStatus, Long> emptyStatusTotals() {
        EnumMap<ContentStatus, Long> totals = new EnumMap<>(ContentStatus.class);
        for (ContentStatus status : ContentStatus.values()) totals.put(status, 0L);
        return totals;
    }
}
