package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.dto.AssignLessonAssessmentRequest;
import com.fesherprep.fesherprep_api.lesson.dto.LessonAssessmentResponse;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.quiz.domain.LessonAssessment;
import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.quiz.repository.LessonAssessmentRepository;
import com.fesherprep.fesherprep_api.quiz.repository.QuizRepository;
import com.fesherprep.fesherprep_api.quiz.service.QuizNotFoundException;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class LessonAssessmentService {
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final LessonAssessmentRepository assessmentRepository;

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public LessonAssessmentResponse getAssessment(UUID lessonId) {
        requireLesson(lessonId);
        return assessmentRepository.findByLessonId(lessonId)
                .map(LessonAssessmentResponse::from)
                .orElseThrow(() -> new LessonAssessmentNotFoundException(lessonId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonAssessmentResponse assignAssessment(
            UUID lessonId,
            @Valid AssignLessonAssessmentRequest request
    ) {
        Lesson lesson = requireLesson(lessonId);
        if (assessmentRepository.existsByLessonId(lessonId)) {
            throw new IllegalStateException("Lesson already has an assessment");
        }
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new QuizNotFoundException(request.quizId()));
        if (lesson.getStatus() == ContentStatus.PUBLISHED
                && quiz.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published lesson requires a published assessment quiz");
        }

        try {
            return LessonAssessmentResponse.from(
                    assessmentRepository.saveAndFlush(new LessonAssessment(lesson, quiz))
            );
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Lesson already has an assessment", exception);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void removeAssessment(UUID lessonId) {
        requireLesson(lessonId);
        long deleted = assessmentRepository.deleteByLessonId(lessonId);
        if (deleted == 0) {
            throw new LessonAssessmentNotFoundException(lessonId);
        }
    }

    private Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException(lessonId));
    }
}
