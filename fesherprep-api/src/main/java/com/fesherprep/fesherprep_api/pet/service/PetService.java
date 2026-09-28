package com.fesherprep.fesherprep_api.pet.service;

import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.pet.domain.*;
import com.fesherprep.fesherprep_api.pet.dto.*;
import com.fesherprep.fesherprep_api.pet.repository.*;
import com.fesherprep.fesherprep_api.quiz.domain.Quiz;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Validated
@RequiredArgsConstructor
public class PetService {
    private final PetSettingsRepository settingsRepository;
    private final PetLevelConfigRepository levelRepository;
    private final UserPetRepository userPetRepository;
    private final PetRewardEventRepository rewardRepository;
    private final UserRepository userRepository;

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse getMyPet() {
        User user = currentUserForUpdate();
        return response(getOrCreate(user), requireSettings());
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse feedMyPet() {
        User user = currentUserForUpdate();
        PetSettings settings = requireSettings();
        UserPet pet = getOrCreateForUpdate(user);
        PetLevelConfig level = requireLevel(pet.getPetLevel());
        pet.feed(settings.getEnergyPerFood(), level.getRequiredEnergy(), settings.getMaxLevel());
        return PetStateResponse.from(pet, settings, level);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse upgradeMyPet() {
        User user = currentUserForUpdate();
        PetSettings settings = requireSettings();
        UserPet pet = getOrCreateForUpdate(user);
        PetLevelConfig currentLevel = requireLevel(pet.getPetLevel());
        pet.upgrade(currentLevel.getRequiredEnergy(), settings.getMaxLevel());
        return response(pet, settings);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public PetConfigResponse getConfiguration() {
        return PetConfigResponse.from(requireSettings(), levelResponses());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PetConfigResponse updateConfiguration(@Valid UpdatePetConfigRequest request) {
        if (request.maximumLevel() < userPetRepository.findHighestCurrentLevel()) {
            throw new IllegalStateException("Maximum level cannot be lower than an existing Pet level");
        }
        Map<Integer, PetLevelConfigRequest> requestedLevels = request.levels().stream()
                .collect(Collectors.toMap(PetLevelConfigRequest::level, Function.identity(), (left, right) -> {
                    throw new IllegalArgumentException("Pet level configuration contains duplicates");
                }));
        if (!requestedLevels.keySet().equals(Set.of(1, 2, 3))) {
            throw new IllegalArgumentException("Pet levels 1, 2 and 3 must all be configured");
        }
        for (int level = 1; level < request.maximumLevel(); level++) {
            if (requestedLevels.get(level).requiredEnergy() < 1) {
                throw new IllegalArgumentException("Upgrade energy must be positive below the maximum level");
            }
        }

        PetSettings settings = requireSettings();
        settings.update(
                request.lessonCompletionPoints(), request.quizPassPoints(), request.pointsPerFood(),
                request.energyPerFood(), request.maximumLevel()
        );
        Map<Integer, PetLevelConfig> storedLevels = levelRepository.findAllByOrderByLevelAsc().stream()
                .collect(Collectors.toMap(PetLevelConfig::getLevel, Function.identity()));
        if (!storedLevels.keySet().equals(Set.of(1, 2, 3))) {
            throw new IllegalStateException("Pet level configuration has not been initialized");
        }
        requestedLevels.forEach((level, requested) -> storedLevels.get(level)
                .update(requested.name(), requested.description(), requested.requiredEnergy()));
        return PetConfigResponse.from(settings, levelResponses());
    }

    @Transactional
    public void awardLessonCompletion(User user, Lesson lesson) {
        award(user, PetActivityType.LESSON_COMPLETED, lesson.getId());
    }

    @Transactional
    public void awardQuizPass(User user, Quiz quiz) {
        award(user, PetActivityType.QUIZ_PASSED, quiz.getId());
    }

    private void award(User user, PetActivityType activityType, UUID sourceId) {
        User lockedUser = userRepository.findByIdForUpdate(user.getId())
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
        if (rewardRepository.existsByUserIdAndActivityTypeAndSourceId(
                lockedUser.getId(), activityType, sourceId
        )) return;

        PetSettings settings = requireSettings();
        int points = activityType == PetActivityType.LESSON_COMPLETED
                ? settings.getLessonCompletionPoints()
                : settings.getQuizPassPoints();
        UserPet pet = getOrCreateForUpdate(lockedUser);
        rewardRepository.save(new PetRewardEvent(lockedUser, activityType, sourceId, points));
        pet.addLearningPoints(points, settings.getPointsPerFood());
    }

    private PetStateResponse response(UserPet pet, PetSettings settings) {
        return PetStateResponse.from(pet, settings, requireLevel(pet.getPetLevel()));
    }

    private UserPet getOrCreate(User user) {
        return userPetRepository.findByUserId(user.getId())
                .orElseGet(() -> userPetRepository.save(new UserPet(user)));
    }

    private UserPet getOrCreateForUpdate(User user) {
        return userPetRepository.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> userPetRepository.saveAndFlush(new UserPet(user)));
    }

    private PetSettings requireSettings() {
        return settingsRepository.findById(PetSettings.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("Pet configuration has not been initialized"));
    }

    private PetLevelConfig requireLevel(int level) {
        return levelRepository.findById(level)
                .orElseThrow(() -> new IllegalStateException("Pet level configuration is missing"));
    }

    private List<PetLevelConfigResponse> levelResponses() {
        return levelRepository.findAllByOrderByLevelAsc().stream()
                .map(PetLevelConfigResponse::from)
                .toList();
    }

    private User currentUserForUpdate() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        User current = userRepository.findByEmail(authentication.getName())
                .filter(User::isActive)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
        return userRepository.findByIdForUpdate(current.getId())
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
    }
}
