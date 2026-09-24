package com.fesherprep.fesherprep_api.learningpath.service;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.knowledge.service.KnowledgeNodeNotFoundException;
import com.fesherprep.fesherprep_api.learningpath.domain.LearningPath;
import com.fesherprep.fesherprep_api.learningpath.domain.LearningPathItem;
import com.fesherprep.fesherprep_api.learningpath.domain.UserLearningPath;
import com.fesherprep.fesherprep_api.learningpath.dto.*;
import com.fesherprep.fesherprep_api.learningpath.repository.LearningPathItemRepository;
import com.fesherprep.fesherprep_api.learningpath.repository.LearningPathRepository;
import com.fesherprep.fesherprep_api.learningpath.repository.UserLearningPathRepository;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import com.fesherprep.fesherprep_api.lesson.repository.LessonProgressRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.lesson.service.LessonCompletionService;
import com.fesherprep.fesherprep_api.lesson.service.LessonNotFoundException;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class LearningPathService {
    private final LearningPathRepository pathRepository;
    private final LearningPathItemRepository itemRepository;
    private final UserLearningPathRepository userPathRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final LessonCompletionService completionService;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<LearningPathSummaryResponse> getPublishedPaths(Pageable pageable) {
        return pathRepository.findAllByStatus(ContentStatus.PUBLISHED, pageable)
                .map(LearningPathSummaryResponse::from);
    }

    @Transactional(readOnly = true)
    public LearningPathDetailResponse getPublishedPath(UUID pathId) {
        LearningPath path = pathRepository.findByIdAndStatus(pathId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LearningPathNotFoundException(pathId));
        return toDetail(path, true);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public UserLearningPathResponse joinPath(UUID pathId) {
        User user = requireCurrentUser();
        LearningPath path = pathRepository.findByIdAndStatus(pathId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LearningPathNotFoundException(pathId));
        if (userPathRepository.existsByUserIdAndLearningPathId(user.getId(), pathId)) {
            throw new IllegalStateException("User already joined this learning path");
        }

        try {
            return UserLearningPathResponse.from(
                    userPathRepository.saveAndFlush(new UserLearningPath(user, path))
            );
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("User already joined this learning path", exception);
        }
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<UserLearningPathResponse> getMyPaths(Pageable pageable) {
        User user = requireCurrentUser();
        return userPathRepository
                .findAllByUserIdAndLearningPathStatus(
                        user.getId(),
                        ContentStatus.PUBLISHED,
                        pageable
                )
                .map(UserLearningPathResponse::from);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public LearningPathProgressResponse getMyPathProgress(UUID pathId) {
        User user = requireCurrentUser();
        LearningPath path = pathRepository.findByIdAndStatus(pathId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LearningPathNotFoundException(pathId));
        if (!userPathRepository.existsByUserIdAndLearningPathId(user.getId(), pathId)) {
            throw new IllegalStateException("Join the learning path before viewing its progress");
        }

        List<LearningPathItem> items = itemRepository
                .findAllByLearningPathIdOrderByDisplayOrderAsc(pathId);
        List<Lesson> lessons = items.stream().map(LearningPathItem::getLesson).toList();
        List<UUID> lessonIds = lessons.stream().map(Lesson::getId).toList();
        Map<UUID, LessonProgress> progressByLessonId = progressRepository
                .findAllByUserIdAndLessonIdIn(user.getId(), lessonIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        progress -> progress.getLesson().getId(),
                        progress -> progress
                ));
        Map<UUID, LessonCompletionService.LessonCompletionResult> completions =
                completionService.evaluateAll(user.getId(), lessons, progressByLessonId);

        List<LearningPathLessonProgressResponse> lessonResults = new ArrayList<>();
        for (LearningPathItem item : items) {
            LessonCompletionService.LessonCompletionResult completion =
                    completions.get(item.getLesson().getId());
            lessonResults.add(new LearningPathLessonProgressResponse(
                    item.getId(),
                    item.getLesson().getId(),
                    item.getLesson().getTitle(),
                    item.getDisplayOrder(),
                    item.isRequired(),
                    item.getWeight(),
                    completion.readingQualified(),
                    completion.assessmentRequired(),
                    completion.assessmentQuizId(),
                    completion.assessmentStatus(),
                    completion.completed()
            ));
        }

        int completedItems = (int) lessonResults.stream()
                .filter(LearningPathLessonProgressResponse::completed)
                .count();
        List<LearningPathLessonProgressResponse> requiredItems = lessonResults.stream()
                .filter(LearningPathLessonProgressResponse::required)
                .toList();
        int completedRequiredItems = (int) requiredItems.stream()
                .filter(LearningPathLessonProgressResponse::completed)
                .count();
        long totalRequiredWeight = requiredItems.stream()
                .mapToLong(LearningPathLessonProgressResponse::weight)
                .sum();
        long completedRequiredWeight = requiredItems.stream()
                .filter(LearningPathLessonProgressResponse::completed)
                .mapToLong(LearningPathLessonProgressResponse::weight)
                .sum();
        BigDecimal percentage = totalRequiredWeight == 0
                ? BigDecimal.ZERO.setScale(2)
                : BigDecimal.valueOf(completedRequiredWeight)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalRequiredWeight), 2, RoundingMode.HALF_UP);
        boolean completed = !requiredItems.isEmpty()
                && completedRequiredItems == requiredItems.size();

        return new LearningPathProgressResponse(
                path.getId(),
                path.getName(),
                lessonResults.size(),
                completedItems,
                requiredItems.size(),
                completedRequiredItems,
                totalRequiredWeight,
                completedRequiredWeight,
                percentage,
                completed,
                lessonResults
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<LearningPathSummaryResponse> getAllPaths(Pageable pageable) {
        return pathRepository.findAll(pageable)
                .map(LearningPathSummaryResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public LearningPathDetailResponse getPath(UUID pathId) {
        return toDetail(requirePath(pathId), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse createPath(@Valid CreateLearningPathRequest request) {
        KnowledgeNode technology = requireTechnology(request.technologyId());
        String slug = normalizeSlug(request.slug());
        ensureUniqueSlug(slug, null);
        LearningPath path = new LearningPath(request.name(), slug, technology);
        return toDetail(savePath(path, slug), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse updatePath(
            UUID pathId,
            @Valid UpdateLearningPathRequest request
    ) {
        LearningPath path = requirePath(pathId);
        String slug = normalizeSlug(request.slug());
        ensureUniqueSlug(slug, pathId);
        path.rename(request.name(), slug);
        return toDetail(savePath(path, slug), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse changeStatus(
            UUID pathId,
            @Valid ChangeLearningPathStatusRequest request
    ) {
        if (request.status() == ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Use publishPath to validate the learning path");
        }
        LearningPath path = requirePath(pathId);
        path.changeStatus(request.status());
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse publishPath(UUID pathId) {
        LearningPath path = requirePath(pathId);
        validatePublish(path);
        path.changeStatus(ContentStatus.PUBLISHED);
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse archivePath(UUID pathId) {
        LearningPath path = requirePath(pathId);
        path.changeStatus(ContentStatus.ARCHIVED);
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse addItem(
            UUID pathId,
            @Valid AddLearningPathItemRequest request
    ) {
        LearningPath path = requirePath(pathId);
        Lesson lesson = lessonRepository.findById(request.lessonId())
                .orElseThrow(() -> new LessonNotFoundException(request.lessonId()));
        if (itemRepository.existsByLearningPathIdAndLessonId(pathId, lesson.getId())) {
            throw new IllegalStateException("Lesson already exists in this learning path");
        }
        ensureAvailablePosition(pathId, request.displayOrder(), null);
        if (path.getStatus() == ContentStatus.PUBLISHED
                && lesson.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published learning path can only contain published lessons");
        }

        LearningPathItem item = new LearningPathItem(
                path,
                lesson,
                request.displayOrder(),
                request.required(),
                request.weight()
        );
        try {
            itemRepository.saveAndFlush(item);
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Learning path item conflicts with existing data", exception);
        }
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse updateItem(
            UUID pathId,
            UUID itemId,
            @Valid UpdateLearningPathItemRequest request
    ) {
        LearningPath path = requirePath(pathId);
        LearningPathItem item = requireItem(pathId, itemId);
        ensureAvailablePosition(pathId, request.displayOrder(), itemId);
        item.configure(request.displayOrder(), request.required(), request.weight());
        itemRepository.flush();
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LearningPathDetailResponse removeItem(UUID pathId, UUID itemId) {
        LearningPath path = requirePath(pathId);
        LearningPathItem item = requireItem(pathId, itemId);
        itemRepository.delete(item);
        itemRepository.flush();
        return toDetail(path, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deletePath(UUID pathId) {
        LearningPath path = requirePath(pathId);
        if (path.getStatus() != ContentStatus.DRAFT && path.getStatus() != ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Only draft or archived learning paths can be deleted");
        }
        if (userPathRepository.existsByLearningPathId(pathId)) {
            throw new IllegalStateException("A joined learning path cannot be deleted");
        }
        itemRepository.deleteAllByLearningPathId(pathId);
        pathRepository.delete(path);
        pathRepository.flush();
    }

    private LearningPathDetailResponse toDetail(LearningPath path, boolean publishedOnly) {
        List<LearningPathItemResponse> items = itemRepository
                .findAllByLearningPathIdOrderByDisplayOrderAsc(path.getId())
                .stream()
                .filter(item -> !publishedOnly || item.getLesson().getStatus() == ContentStatus.PUBLISHED)
                .map(LearningPathItemResponse::from)
                .toList();
        return LearningPathDetailResponse.from(path, items);
    }

    private void validatePublish(LearningPath path) {
        if (path.getTechnology().getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Publish the learning path technology first");
        }
        List<LearningPathItem> items = itemRepository
                .findAllByLearningPathIdOrderByDisplayOrderAsc(path.getId());
        if (items.isEmpty()) {
            throw new IllegalStateException("A learning path requires at least one lesson");
        }
        if (items.stream().anyMatch(item -> item.getLesson().getStatus() != ContentStatus.PUBLISHED)) {
            throw new IllegalStateException("Publish every learning path lesson first");
        }
    }

    private LearningPath requirePath(UUID pathId) {
        return pathRepository.findById(pathId)
                .orElseThrow(() -> new LearningPathNotFoundException(pathId));
    }

    private LearningPathItem requireItem(UUID pathId, UUID itemId) {
        return itemRepository.findByIdAndLearningPathId(itemId, pathId)
                .orElseThrow(() -> new IllegalArgumentException("Learning path item does not exist"));
    }

    private KnowledgeNode requireTechnology(UUID technologyId) {
        KnowledgeNode technology = knowledgeNodeRepository.findById(technologyId)
                .orElseThrow(() -> new KnowledgeNodeNotFoundException(technologyId));
        if (technology.getType() != NodeType.TECHNOLOGY) {
            throw new IllegalArgumentException("Learning path parent must be a technology node");
        }
        return technology;
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                        "Authenticated user no longer exists"
                ));
    }

    private void ensureUniqueSlug(String slug, UUID currentPathId) {
        boolean exists = currentPathId == null
                ? pathRepository.existsBySlug(slug)
                : pathRepository.existsBySlugAndIdNot(slug, currentPathId);
        if (exists) {
            throw new IllegalStateException("Learning path slug is already in use: " + slug);
        }
    }

    private void ensureAvailablePosition(UUID pathId, int displayOrder, UUID currentItemId) {
        boolean exists = currentItemId == null
                ? itemRepository.existsByLearningPathIdAndDisplayOrder(pathId, displayOrder)
                : itemRepository.existsByLearningPathIdAndDisplayOrderAndIdNot(
                        pathId,
                        displayOrder,
                        currentItemId
                );
        if (exists) {
            throw new IllegalStateException("Learning path display order is already in use");
        }
    }

    private LearningPath savePath(LearningPath path, String slug) {
        try {
            return pathRepository.saveAndFlush(path);
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalStateException("Learning path slug is already in use: " + slug, exception);
        }
    }

    private static String normalizeSlug(String slug) {
        return Objects.requireNonNull(slug, "Slug is required")
                .strip()
                .toLowerCase(Locale.ROOT);
    }
}
