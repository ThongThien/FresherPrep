package com.fesherprep.fesherprep_api.practice.service;

import com.fesherprep.fesherprep_api.pet.service.PetService;
import com.fesherprep.fesherprep_api.practice.domain.*;
import com.fesherprep.fesherprep_api.practice.dto.*;
import com.fesherprep.fesherprep_api.practice.repository.*;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Clock;
import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SqlPracticeService {
    private final PracticeExerciseRepository exerciseRepository;
    private final UserPracticeProgressRepository progressRepository;
    private final PracticeSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final SqlPracticeExecutionEngine executionEngine;
    private final PetService petService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<PracticeExerciseSummaryResponse> exercises() {
        UUID userId = currentUserId();
        List<PracticeExercise> exercises = publishedExercises();
        Set<UUID> completed = progressRepository.findCompletedExerciseIds(userId);
        List<PracticeExerciseSummaryResponse> responses = new ArrayList<>();
        for (int index = 0; index < exercises.size(); index++) {
            PracticeExercise exercise = exercises.get(index);
            boolean locked = index > 0 && !completed.contains(exercises.get(index - 1).getId());
            responses.add(new PracticeExerciseSummaryResponse(
                    exercise.getId(), exercise.getCode(), exercise.getTitle(), exercise.getDifficulty(),
                    exercise.getConcepts(), exercise.getDisplayOrder(), locked,
                    completed.contains(exercise.getId())));
        }
        return List.copyOf(responses);
    }

    @Transactional(readOnly = true)
    public PracticeExerciseDetailResponse exercise(UUID exerciseId) {
        UUID userId = currentUserId();
        PracticeExercise exercise = requirePublished(exerciseId);
        Set<UUID> completed = progressRepository.findCompletedExerciseIds(userId);
        requireUnlocked(exercise, publishedExercises(), completed);
        return PracticeExerciseDetailResponse.from(exercise, completed.contains(exerciseId));
    }

    @Transactional
    public SqlSubmitResponse submit(UUID exerciseId, @Valid SqlSubmitRequest request) {
        User user = userRepository.findByIdForUpdate(currentUserId())
                .filter(User::isActive)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
        PracticeExercise exercise = requirePublished(exerciseId);
        Set<UUID> completed = progressRepository.findCompletedExerciseIds(user.getId());
        requireUnlocked(exercise, publishedExercises(), completed);

        var comparison = executionEngine.executeAndCompare(request.query(), exercise.getReferenceQuery());
        boolean correct = comparison.correct();
        submissionRepository.save(new PracticeSubmission(user, exercise, request.query().strip(), correct));

        UserPracticeProgress progress = progressRepository.findForUpdate(user.getId(), exerciseId)
                .orElseGet(() -> new UserPracticeProgress(user, exercise));
        boolean firstCompletion = progress.recordAttempt(correct, clock.instant());
        progressRepository.save(progress);
        int awardedPoints = firstCompletion
                ? petService.awardSqlPracticeCompletion(user, exercise.getId()) : 0;

        String message = comparison.error() != null
                ? comparison.error()
                : correct ? "Correct result" : "The result does not match the expected columns, rows, or order";
        return new SqlSubmitResponse(
                correct,
                firstCompletion,
                awardedPoints,
                message,
                correct ? exercise.getExplanation() : null,
                comparison.result());
    }

    private List<PracticeExercise> publishedExercises() {
        return exerciseRepository.findAllByLanguageAndStatusOrderByDisplayOrderAsc(
                PracticeLanguage.SQL, ContentStatus.PUBLISHED);
    }

    private PracticeExercise requirePublished(UUID id) {
        return exerciseRepository.findByIdAndLanguageAndStatus(
                        id, PracticeLanguage.SQL, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new PracticeExerciseNotFoundException(id));
    }

    private static void requireUnlocked(
            PracticeExercise requested,
            List<PracticeExercise> exercises,
            Set<UUID> completed
    ) {
        for (int index = 0; index < exercises.size(); index++) {
            if (!exercises.get(index).getId().equals(requested.getId())) continue;
            if (index > 0 && !completed.contains(exercises.get(index - 1).getId())) {
                throw new IllegalStateException("Complete the previous SQL exercise first");
            }
            return;
        }
        throw new PracticeExerciseNotFoundException(requested.getId());
    }

    private static UUID currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
    }
}

