package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import com.fesherprep.fesherprep_api.lesson.dto.AssessmentProgressStatus;
import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.LessonAssessment;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;
import com.fesherprep.fesherprep_api.quiz.repository.LessonAssessmentRepository;
import com.fesherprep.fesherprep_api.quiz.repository.QuizAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonCompletionService {
    private final LessonAssessmentRepository assessmentRepository;
    private final QuizAttemptRepository attemptRepository;

    @Transactional(readOnly = true)
    public LessonCompletionResult evaluate(UUID userId, Lesson lesson, LessonProgress progress) {
        return evaluateAll(
                userId,
                List.of(lesson),
                progress == null ? Map.of() : Map.of(lesson.getId(), progress)
        ).get(lesson.getId());
    }

    @Transactional(readOnly = true)
    public Map<UUID, LessonCompletionResult> evaluateAll(
            UUID userId,
            Collection<Lesson> lessons,
            Map<UUID, LessonProgress> progressByLessonId
    ) {
        if (lessons.isEmpty()) {
            return Map.of();
        }
        Set<UUID> lessonIds = lessons.stream().map(Lesson::getId).collect(Collectors.toSet());
        Map<UUID, LessonAssessment> assessmentsByLessonId = assessmentRepository
                .findAllByLessonIdIn(lessonIds)
                .stream()
                .collect(Collectors.toMap(item -> item.getLesson().getId(), Function.identity()));
        Set<UUID> quizIds = assessmentsByLessonId.values().stream()
                .map(item -> item.getQuiz().getId())
                .collect(Collectors.toSet());
        Map<UUID, List<QuizAttempt>> attemptsByQuizId = quizIds.isEmpty()
                ? Map.of()
                : attemptRepository.findAllByUserIdAndQuizIdIn(userId, quizIds)
                        .stream()
                        .collect(Collectors.groupingBy(attempt -> attempt.getQuiz().getId()));

        Map<UUID, LessonCompletionResult> results = new HashMap<>();
        for (Lesson lesson : lessons) {
            LessonProgress progress = progressByLessonId.get(lesson.getId());
            LessonAssessment assessment = assessmentsByLessonId.get(lesson.getId());
            List<QuizAttempt> attempts = assessment == null
                    ? List.of()
                    : attemptsByQuizId.getOrDefault(assessment.getQuiz().getId(), List.of());
            results.put(lesson.getId(), evaluate(progress, assessment, attempts));
        }
        return results;
    }

    private LessonCompletionResult evaluate(
            LessonProgress progress,
            LessonAssessment assessment,
            List<QuizAttempt> attempts
    ) {
        boolean readingQualified = progress != null && progress.getReadQualifiedAt() != null;
        if (assessment == null) {
            return new LessonCompletionResult(
                    readingQualified,
                    false,
                    null,
                    AssessmentProgressStatus.NOT_REQUIRED,
                    readingQualified
            );
        }

        UUID quizId = assessment.getQuiz().getId();
        boolean passed = attempts.stream().anyMatch(QuizAttempt::isPassed);
        AssessmentProgressStatus status;
        if (passed) {
            status = AssessmentProgressStatus.PASSED;
        } else if (attempts.stream().anyMatch(attempt -> attempt.getStatus() == AttemptStatus.IN_PROGRESS)) {
            status = AssessmentProgressStatus.IN_PROGRESS;
        } else if (attempts.stream().anyMatch(attempt -> attempt.getStatus() == AttemptStatus.SUBMITTED)) {
            status = AssessmentProgressStatus.FAILED;
        } else {
            status = AssessmentProgressStatus.NOT_STARTED;
        }
        return new LessonCompletionResult(readingQualified, true, quizId, status, passed);
    }

    public record LessonCompletionResult(
            boolean readingQualified,
            boolean assessmentRequired,
            UUID assessmentQuizId,
            AssessmentProgressStatus assessmentStatus,
            boolean completed
    ) {
    }
}
