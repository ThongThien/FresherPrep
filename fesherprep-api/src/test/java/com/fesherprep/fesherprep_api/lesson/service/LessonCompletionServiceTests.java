package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import com.fesherprep.fesherprep_api.lesson.dto.AssessmentProgressStatus;
import com.fesherprep.fesherprep_api.quiz.domain.AttemptStatus;
import com.fesherprep.fesherprep_api.quiz.domain.LessonAssessment;
import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.quiz.domain.QuizAttempt;
import com.fesherprep.fesherprep_api.quiz.repository.LessonAssessmentRepository;
import com.fesherprep.fesherprep_api.quiz.repository.QuizAttemptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LessonCompletionServiceTests {
    private final UUID userId = UUID.randomUUID();
    private final UUID lessonId = UUID.randomUUID();
    private final UUID quizId = UUID.randomUUID();
    private final LessonAssessmentRepository assessmentRepository = mock(LessonAssessmentRepository.class);
    private final QuizAttemptRepository attemptRepository = mock(QuizAttemptRepository.class);
    private final LessonCompletionService service =
            new LessonCompletionService(assessmentRepository, attemptRepository);
    private Lesson lesson;
    private LessonProgress progress;

    @BeforeEach
    void setUp() {
        lesson = mock(Lesson.class);
        progress = mock(LessonProgress.class);
        LessonAssessment assessment = mock(LessonAssessment.class);
        Quiz quiz = mock(Quiz.class);
        QuizAttempt passingAttempt = mock(QuizAttempt.class);

        when(lesson.getId()).thenReturn(lessonId);
        when(progress.getLesson()).thenReturn(lesson);
        when(progress.getReadQualifiedAt()).thenReturn(Instant.parse("2026-09-25T00:00:00Z"));
        when(assessment.getLesson()).thenReturn(lesson);
        when(assessment.getQuiz()).thenReturn(quiz);
        when(assessment.getPassPercentage()).thenReturn(80);
        when(quiz.getId()).thenReturn(quizId);
        when(passingAttempt.getQuiz()).thenReturn(quiz);
        when(passingAttempt.getStatus()).thenReturn(AttemptStatus.SUBMITTED);
        when(passingAttempt.getSubmittedAt()).thenReturn(Instant.parse("2026-09-25T00:05:00Z"));
        when(passingAttempt.getScorePercentage()).thenReturn(BigDecimal.valueOf(80));
        when(passingAttempt.isPassed()).thenReturn(true);
        when(assessmentRepository.findAllByLessonIdIn(anyCollection())).thenReturn(List.of(assessment));
        when(attemptRepository.findAllByUserIdAndQuizIdIn(eq(userId), anyCollection()))
                .thenReturn(List.of(passingAttempt));
    }

    @Test
    void passingAssessmentStillRequiresReadingQualification() {
        LessonCompletionService.LessonCompletionResult result =
                service.evaluateAll(userId, List.of(lesson), Map.of()).get(lessonId);

        assertFalse(result.readingQualified());
        assertTrue(result.assessmentStatus() == AssessmentProgressStatus.PASSED);
        assertFalse(result.completed());
    }

    @Test
    void qualifiedReadingAndPassingAssessmentCompleteLesson() {
        LessonCompletionService.LessonCompletionResult result = service
                .evaluateAll(userId, List.of(lesson), Map.of(lessonId, progress))
                .get(lessonId);

        assertTrue(result.readingQualified());
        assertTrue(result.completed());
    }
}
