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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
public class PetService {
    private static final Set<String> ADMIN_SORT_FIELDS = Set.of("updatedAt", "petLevel", "totalLearningPoints");
    private final PetSettingsRepository settingsRepository;
    private final PetRepository petRepository;
    private final PetLevelConfigRepository levelRepository;
    private final UserPetRepository userPetRepository;
    private final PetRewardEventRepository rewardRepository;
    private final UserRepository userRepository;

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse getMyPet() {
        User user = currentUserForUpdate();
        return response(requireOrCreateInitialPet(user));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public PetCollectionResponse getMyCollection() {
        UUID userId = currentUserId();
        List<UserPet> progressions = userPetRepository.findAllByUserIdOrderByCreatedAtAsc(userId);
        PetStateResponse active = progressions.stream()
                .filter(item -> item.getStatus() == UserPetStatus.ACTIVE).findFirst()
                .map(this::response).orElse(null);
        List<PetStateResponse> completed = progressions.stream()
                .filter(item -> item.getStatus() == UserPetStatus.COMPLETED).map(this::response).toList();
        Set<UUID> owned = progressions.stream().map(item -> item.getPet().getId()).collect(java.util.stream.Collectors.toSet());
        List<PetDefinitionResponse> available = petRepository.findAllByActiveTrueOrderByDisplayOrderAsc().stream()
                .filter(pet -> !owned.contains(pet.getId())).map(PetDefinitionResponse::from).toList();
        return new PetCollectionResponse(active, completed, available);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse feedMyPet(boolean all) {
        User user = currentUserForUpdate();
        UserPet progress = requireActiveForUpdate(user);
        PetLevelConfig level = findLevel(levels(progress.getPet()), progress.getPetLevel());
        PetSettings settings = requireSettings();
        int food = 1;
        if (all) {
            int remaining = Math.max(0, level.getRequiredEnergy() - progress.getEnergy());
            int useful = (remaining + settings.getEnergyPerFood() - 1) / settings.getEnergyPerFood();
            food = Math.min(progress.getAvailableFood(), useful);
        }
        progress.feed(food, settings.getEnergyPerFood(), level.getRequiredEnergy());
        return response(progress);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse upgradeMyPet() {
        User user = currentUserForUpdate();
        UserPet progress = requireActiveForUpdate(user);
        List<PetLevelConfig> levels = levels(progress.getPet());
        PetLevelConfig current = findLevel(levels, progress.getPetLevel());
        progress.upgrade(current.getRequiredEnergy(), levels.size());
        return response(progress);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public PetStateResponse selectPet(UUID petId) {
        User user = currentUserForUpdate();
        if (userPetRepository.findActiveByUserIdForUpdate(user.getId()).isPresent()) {
            throw new IllegalStateException("Complete the active Pet before choosing another Pet");
        }
        Pet pet = petRepository.findWithLevelsById(petId)
                .filter(Pet::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Pet is unavailable"));
        if (userPetRepository.existsByUserIdAndPetId(user.getId(), petId)) {
            throw new IllegalStateException("This Pet is already in the collection");
        }
        validateLevels(pet.getLevels());
        UserPet progress = new UserPet(user, pet);
        progress.completeIfAtMaximum(pet.getLevels().size());
        UserPet saved = userPetRepository.saveAndFlush(progress);
        applyPendingRewards(saved);
        return response(saved);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public PetConfigResponse getConfiguration() {
        return PetConfigResponse.from(requireSettings());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PetConfigResponse updateConfiguration(@Valid UpdatePetConfigRequest request) {
        PetSettings settings = requireSettings();
        settings.update(request.lessonCompletionPoints(), request.quizPassPoints(),
                request.pointsPerFood(), request.energyPerFood());
        return PetConfigResponse.from(settings);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<PetDefinitionResponse> getPetDefinitions() {
        return petRepository.findAllByOrderByDisplayOrderAsc().stream().map(PetDefinitionResponse::from).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PetDefinitionResponse createPet(@Valid UpsertPetRequest request) {
        if (petRepository.existsByCodeIgnoreCase(request.code())) {
            throw new IllegalStateException("Pet code already exists");
        }
        Pet pet = new Pet(request.code(), request.name().vi(), request.name().en(),
                request.description().vi(), request.description().en(),
                request.learningMeaning().vi(), request.learningMeaning().en(),
                request.active(), request.displayOrder());
        pet.replaceLevels(buildLevels(pet, request.levels()));
        return PetDefinitionResponse.from(petRepository.saveAndFlush(pet));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public PetDefinitionResponse updatePet(UUID petId, @Valid UpsertPetRequest request) {
        Pet pet = petRepository.findWithLevelsById(petId)
                .orElseThrow(() -> new IllegalArgumentException("Pet does not exist"));
        if (petRepository.existsByCodeIgnoreCaseAndIdNot(request.code(), petId)) {
            throw new IllegalStateException("Pet code already exists");
        }
        int existingMaximum = userPetRepository.findMaximumLevelByPetId(petId);
        if (request.levels().size() < existingMaximum) {
            throw new IllegalStateException("Cannot remove a level already reached by a user");
        }
        pet.update(request.code(), request.name().vi(), request.name().en(),
                request.description().vi(), request.description().en(),
                request.learningMeaning().vi(), request.learningMeaning().en(),
                request.active(), request.displayOrder());
        pet.replaceLevels(buildLevels(pet, request.levels()));
        return PetDefinitionResponse.from(petRepository.saveAndFlush(pet));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<AdminUserPetResponse> getAdminUserPets(String search, Pageable pageable) {
        Pageable safe = safePageable(pageable);
        Page<UserPet> pets = search == null || search.isBlank()
                ? userPetRepository.findAll(safe)
                : userPetRepository.findAllByUserEmailContainingIgnoreCaseOrUserDisplayNameContainingIgnoreCase(
                        search.strip(), search.strip(), safe);
        return pets.map(AdminUserPetResponse::from);
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
        User locked = userRepository.findByIdForUpdate(user.getId())
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
        if (rewardRepository.existsByUserIdAndActivityTypeAndSourceId(locked.getId(), activityType, sourceId)) return;
        PetSettings settings = requireSettings();
        int points = activityType == PetActivityType.LESSON_COMPLETED
                ? settings.getLessonCompletionPoints() : settings.getQuizPassPoints();
        Optional<UserPet> active = userPetRepository.findActiveByUserIdForUpdate(locked.getId());
        if (active.isEmpty() && userPetRepository.findAllByUserIdOrderByCreatedAtAsc(locked.getId()).isEmpty()) {
            active = Optional.of(initialPet(locked));
        }
        PetRewardEvent event = rewardRepository.save(new PetRewardEvent(locked, activityType, sourceId, points));
        active.ifPresent(progress -> {
            progress.addLearningPoints(points, settings.getPointsPerFood());
            event.markApplied();
        });
    }

    private UserPet requireOrCreateInitialPet(User user) {
        return userPetRepository.findActiveByUserIdForUpdate(user.getId()).orElseGet(() -> {
            if (!userPetRepository.findAllByUserIdOrderByCreatedAtAsc(user.getId()).isEmpty()) {
                throw new IllegalStateException("Choose the next Pet from your collection");
            }
            return initialPet(user);
        });
    }

    private UserPet initialPet(User user) {
        Pet pet = petRepository.findAllByActiveTrueOrderByDisplayOrderAsc().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No active Pet has been configured"));
        validateLevels(pet.getLevels());
        UserPet progress = new UserPet(user, pet);
        progress.completeIfAtMaximum(pet.getLevels().size());
        UserPet saved = userPetRepository.saveAndFlush(progress);
        applyPendingRewards(saved);
        return saved;
    }

    private void applyPendingRewards(UserPet progress) {
        PetSettings settings = requireSettings();
        rewardRepository.findAllByUserIdAndAppliedFalseOrderByCreatedAtAsc(progress.getUser().getId())
                .forEach(event -> {
                    progress.addLearningPoints(event.getPointsAwarded(), settings.getPointsPerFood());
                    event.markApplied();
                });
    }

    private UserPet requireActiveForUpdate(User user) {
        return userPetRepository.findActiveByUserIdForUpdate(user.getId())
                .orElseThrow(() -> new IllegalStateException("Choose an active Pet first"));
    }

    private PetStateResponse response(UserPet progress) {
        List<PetLevelConfig> levels = levels(progress.getPet());
        return PetStateResponse.from(progress, requireSettings(),
                findLevel(levels, progress.getPetLevel()), levels.size());
    }

    private List<PetLevelConfig> levels(Pet pet) {
        List<PetLevelConfig> result = pet.getLevels().isEmpty()
                ? levelRepository.findAllByPetIdOrderByLevelOrderAsc(pet.getId()) : pet.getLevels();
        validateLevels(result);
        return result;
    }

    private static PetLevelConfig findLevel(List<PetLevelConfig> levels, int order) {
        return levels.stream().filter(level -> level.getLevelOrder() == order).findFirst()
                .orElseThrow(() -> new IllegalStateException("Pet level configuration is missing"));
    }

    private static List<PetLevelConfig> buildLevels(Pet pet, List<PetLevelConfigRequest> requests) {
        List<PetLevelConfigRequest> sorted = requests.stream()
                .sorted(Comparator.comparingInt(PetLevelConfigRequest::level)).toList();
        for (int index = 0; index < sorted.size(); index++) {
            if (sorted.get(index).level() != index + 1) {
                throw new IllegalArgumentException("Pet levels must be contiguous and start at 1");
            }
            if (index < sorted.size() - 1 && sorted.get(index).requiredEnergy() < 1) {
                throw new IllegalArgumentException("Every non-final level requires positive Energy");
            }
        }
        return sorted.stream().map(level -> new PetLevelConfig(
                pet, level.level(), level.name().vi(), level.name().en(),
                level.description().vi(), level.description().en(),
                level.requiredEnergy(), level.assetReference())).toList();
    }

    private static void validateLevels(List<PetLevelConfig> levels) {
        if (levels.isEmpty()) throw new IllegalStateException("Pet requires at least one level");
        for (int index = 0; index < levels.size(); index++) {
            if (levels.get(index).getLevelOrder() != index + 1) {
                throw new IllegalStateException("Pet levels must be contiguous");
            }
        }
    }

    private PetSettings requireSettings() {
        return settingsRepository.findById(PetSettings.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException("Pet configuration has not been initialized"));
    }

    private User currentUserForUpdate() {
        return userRepository.findByIdForUpdate(currentUserId()).filter(User::isActive)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("User is unavailable"));
    }

    private static UUID currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        try { return UUID.fromString(authentication.getName()); }
        catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
    }

    private static Pageable safePageable(Pageable pageable) {
        List<Sort.Order> orders = pageable.getSort().stream()
                .filter(order -> ADMIN_SORT_FIELDS.contains(order.getProperty())).toList();
        return PageRequest.of(pageable.getPageNumber(), Math.min(pageable.getPageSize(), 100),
                orders.isEmpty() ? Sort.by(Sort.Direction.DESC, "updatedAt") : Sort.by(orders));
    }
}
