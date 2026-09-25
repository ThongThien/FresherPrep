package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.domain.LessonPrerequisite;
import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import com.fesherprep.fesherprep_api.lesson.dto.*;
import com.fesherprep.fesherprep_api.lesson.repository.LessonPrerequisiteRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonProgressRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.quiz.repository.LessonAssessmentRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
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

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
public class LessonService {
    private final LessonRepository lessonRepository;
    private final LessonPrerequisiteRepository prerequisiteRepository;
    private final LessonProgressRepository progressRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final UserRepository userRepository;
    private final LessonAssessmentRepository assessmentRepository;
    private final LessonCompletionService completionService;
    private final Clock clock;
    private final ContentIdentityGenerator identityGenerator;

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<LessonSummaryResponse> getPublishedLessons(UUID subtopicId, Pageable pageable) {
        requirePublishedSubtopic(subtopicId);
        return lessonRepository
                .findAllBySubtopicIdAndStatus(
                        subtopicId,
                        ContentStatus.PUBLISHED,
                        pageable
                )
                .map(LessonSummaryResponse::from);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public LessonDetailResponse getPublishedLesson(UUID lessonId) {
        return toDetail(requirePublishedLesson(lessonId), true);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public LessonDetailResponse getPublishedLessonBySlug(String slug) {
        Lesson lesson = lessonRepository
                .findBySlugAndStatus(normalizeSlug(slug), ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LessonNotFoundException(slug));
        requirePublishedSubtopic(lesson.getSubtopic().getId());
        return toDetail(lesson, true);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public List<LessonSummaryResponse> getPublishedPrerequisites(UUID lessonId) {
        requirePublishedLesson(lessonId);
        return prerequisiteResponses(lessonId, true);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public LessonProgressResponse startProgress(UUID lessonId) {
        User user = requireCurrentUser();
        Lesson lesson = requirePublishedLesson(lessonId);
        Instant now = clock.instant();

        LessonProgress progress = progressRepository
                .findByUserIdAndLessonId(user.getId(), lessonId)
                .orElseGet(() -> progressRepository.save(new LessonProgress(user, lesson, now)));

        if (progress.getLastViewedAt().isBefore(now)) {
            progress.recordReading(0, progress.getMaxScrollPercent(), now);
        }
        return progressResponse(user.getId(), progress);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public LessonProgressResponse recordProgress(
            UUID lessonId,
            @Valid RecordLessonProgressRequest request
    ) {
        User user = requireCurrentUser();
        requirePublishedLesson(lessonId);

        LessonProgress progress = progressRepository
                .findByUserIdAndLessonId(user.getId(), lessonId)
                .orElseThrow(() -> new IllegalStateException("Start the lesson before recording progress"));
        progress.recordReading(request.activeSeconds(), request.scrollPercent(), clock.instant());
        return progressResponse(user.getId(), progress);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public LessonProgressResponse getMyProgress(UUID lessonId) {
        User user = requireCurrentUser();
        return progressRepository.findFirstByUserIdAndLessonId(user.getId(), lessonId)
                .map(progress -> progressResponse(user.getId(), progress))
                .orElseThrow(() -> new IllegalArgumentException("Lesson progress does not exist"));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<LessonProgressResponse> getMyProgress(Pageable pageable) {
        User user = requireCurrentUser();
        Page<LessonProgress> progressPage = progressRepository.findAllByUserId(user.getId(), pageable);
        Map<UUID, LessonProgress> progressByLessonId = progressPage.stream()
                .collect(java.util.stream.Collectors.toMap(
                        progress -> progress.getLesson().getId(),
                        progress -> progress
                ));
        Map<UUID, LessonCompletionService.LessonCompletionResult> completions =
                completionService.evaluateAll(
                        user.getId(),
                        progressPage.stream().map(LessonProgress::getLesson).toList(),
                        progressByLessonId
                );
        return progressPage.map(progress -> progressResponse(
                progress,
                completions.get(progress.getLesson().getId())
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<LessonSummaryResponse> getAllLessons(UUID subtopicId, Pageable pageable) {
        if (subtopicId != null) requireSubtopic(subtopicId);
        return (subtopicId == null
                ? lessonRepository.findAll(pageable)
                : lessonRepository.findAllBySubtopicId(subtopicId, pageable))
                .map(LessonSummaryResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public LessonDetailResponse getLesson(UUID lessonId) {
        return toDetail(requireLesson(lessonId), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonDetailResponse createLesson(@Valid CreateLessonRequest request) {
        KnowledgeNode subtopic = requireSubtopic(request.subtopicId());
        String slug = generateUniqueSlug(request.title());

        Lesson lesson = new Lesson(
                subtopic,
                request.title(),
                slug,
                request.content(),
                request.displayOrder(),
                request.minimumReadSeconds(),
                request.requiredScrollPercent()
        );
        return toDetail(save(lesson, slug), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonDetailResponse updateLesson(UUID lessonId, @Valid UpdateLessonRequest request) {
        Lesson lesson = requireLesson(lessonId);
        KnowledgeNode subtopic = requireSubtopic(request.subtopicId());
        String slug = lesson.getSlug();

        if (lesson.getStatus() == ContentStatus.PUBLISHED
                && subtopic.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published lesson requires a published subtopic");
        }

        lesson.assignSubtopic(subtopic);
        lesson.updateContent(request.title(), slug, request.content(), request.displayOrder());
        lesson.configureReading(request.minimumReadSeconds(), request.requiredScrollPercent());
        return toDetail(save(lesson, slug), false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonDetailResponse changeStatus(
            UUID lessonId,
            @Valid ChangeLessonStatusRequest request
    ) {
        Lesson lesson = requireLesson(lessonId);
        ContentStatus target = request.status();

        if (target == ContentStatus.PUBLISHED) {
            validatePublish(lesson);
        }
        if (target == ContentStatus.ARCHIVED) {
            validateArchive(lessonId);
        }

        lesson.changeStatus(target);
        return toDetail(lesson, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonDetailResponse publishLesson(UUID lessonId) {
        return changeStatus(lessonId, new ChangeLessonStatusRequest(ContentStatus.PUBLISHED));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public LessonDetailResponse archiveLesson(UUID lessonId) {
        return changeStatus(lessonId, new ChangeLessonStatusRequest(ContentStatus.ARCHIVED));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteLesson(UUID lessonId) {
        Lesson lesson = requireLesson(lessonId);
        if (lesson.getStatus() != ContentStatus.DRAFT && lesson.getStatus() != ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Only draft or archived lessons can be deleted");
        }
        if (progressRepository.existsByLessonId(lessonId)) {
            throw new IllegalStateException("A lesson with progress history cannot be deleted");
        }
        if (prerequisiteRepository.existsByLessonIdOrPrerequisiteLessonId(lessonId, lessonId)) {
            throw new IllegalStateException("Remove lesson prerequisite relationships first");
        }
        if (assessmentRepository.existsByLessonId(lessonId)) {
            throw new IllegalStateException("Remove the lesson assessment relationship first");
        }
        lessonRepository.delete(lesson);
        lessonRepository.flush();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public List<LessonSummaryResponse> addPrerequisite(UUID lessonId, UUID prerequisiteLessonId) {
        Lesson lesson = requireLesson(lessonId);
        Lesson prerequisite = requireLesson(prerequisiteLessonId);

        if (lesson.hasSameIdentityAs(prerequisite)) {
            throw new IllegalArgumentException("A lesson cannot require itself");
        }
        if (prerequisiteRepository.existsByLessonIdAndPrerequisiteLessonId(
                lessonId,
                prerequisiteLessonId
        )) {
            throw new IllegalArgumentException("Lesson prerequisite already exists");
        }
        if (lesson.getStatus() == ContentStatus.PUBLISHED
                && prerequisite.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published lesson requires published prerequisites");
        }
        ensureNoPrerequisiteCycle(lessonId, prerequisiteLessonId);

        prerequisiteRepository.save(new LessonPrerequisite(lesson, prerequisite));
        return prerequisiteResponses(lessonId, false);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void removePrerequisite(UUID lessonId, UUID prerequisiteLessonId) {
        requireLesson(lessonId);
        long deleted = prerequisiteRepository.deleteByLessonIdAndPrerequisiteLessonId(
                lessonId,
                prerequisiteLessonId
        );
        if (deleted == 0) {
            throw new IllegalArgumentException("Lesson prerequisite does not exist");
        }
    }

    private LessonDetailResponse toDetail(Lesson lesson, boolean publishedOnly) {
        if (publishedOnly) {
            requirePublishedSubtopic(lesson.getSubtopic().getId());
        }
        return LessonDetailResponse.from(
                lesson,
                prerequisiteResponses(lesson.getId(), publishedOnly)
        );
    }

    private List<LessonSummaryResponse> prerequisiteResponses(UUID lessonId, boolean publishedOnly) {
        return prerequisiteRepository.findAllForLesson(lessonId)
                .stream()
                .map(LessonPrerequisite::getPrerequisiteLesson)
                .filter(lesson -> !publishedOnly
                        || lesson.getStatus() == ContentStatus.PUBLISHED
                        && lesson.getSubtopic().getStatus() == ContentStatus.PUBLISHED)
                .map(LessonSummaryResponse::from)
                .toList();
    }

    private Lesson requirePublishedLesson(UUID lessonId) {
        Lesson lesson = lessonRepository.findByIdAndStatus(lessonId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new LessonNotFoundException(lessonId));
        requirePublishedSubtopic(lesson.getSubtopic().getId());
        return lesson;
    }

    private Lesson requireLesson(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new LessonNotFoundException(lessonId));
    }

    private KnowledgeNode requireSubtopic(UUID subtopicId) {
        KnowledgeNode node = knowledgeNodeRepository.findById(subtopicId)
                .orElseThrow(() -> new IllegalArgumentException("Subtopic does not exist"));
        if (node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("A lesson must belong to a subtopic");
        }
        return node;
    }

    private KnowledgeNode requirePublishedSubtopic(UUID subtopicId) {
        KnowledgeNode node = knowledgeNodeRepository
                .findByIdAndStatus(subtopicId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new IllegalArgumentException("Published subtopic does not exist"));
        if (node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("Lesson parent must be a subtopic");
        }
        return node;
    }

    private void validatePublish(Lesson lesson) {
        if (lesson.getSubtopic().getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Publish the lesson subtopic first");
        }
        boolean hasUnpublishedPrerequisite = prerequisiteRepository.findAllForLesson(lesson.getId())
                .stream()
                .map(LessonPrerequisite::getPrerequisiteLesson)
                .anyMatch(prerequisite -> prerequisite.getStatus() != ContentStatus.PUBLISHED
                        || prerequisite.getSubtopic().getStatus() != ContentStatus.PUBLISHED);
        if (hasUnpublishedPrerequisite) {
            throw new IllegalStateException("Publish all prerequisite lessons first");
        }
        assessmentRepository.findByLessonId(lesson.getId()).ifPresent(assessment -> {
            if (assessment.getQuiz().getStatus() != ContentStatus.PUBLISHED) {
                throw new IllegalStateException("Publish the lesson assessment quiz first");
            }
        });
    }

    private LessonProgressResponse progressResponse(UUID userId, LessonProgress progress) {
        LessonCompletionService.LessonCompletionResult completion = completionService.evaluate(
                userId,
                progress.getLesson(),
                progress
        );
        return progressResponse(progress, completion);
    }

    private LessonProgressResponse progressResponse(
            LessonProgress progress,
            LessonCompletionService.LessonCompletionResult completion
    ) {
        return LessonProgressResponse.from(
                progress,
                completion.assessmentRequired(),
                completion.assessmentQuizId(),
                completion.assessmentStatus(),
                completion.completed()
        );
    }

    private void validateArchive(UUID lessonId) {
        boolean usedByPublishedLesson = prerequisiteRepository
                .findAllByPrerequisiteLessonId(lessonId)
                .stream()
                .map(LessonPrerequisite::getLesson)
                .anyMatch(dependent -> dependent.getStatus() == ContentStatus.PUBLISHED);
        if (usedByPublishedLesson) {
            throw new IllegalStateException("Archive dependent published lessons first");
        }
    }

    private void ensureNoPrerequisiteCycle(UUID lessonId, UUID prerequisiteLessonId) {
        Map<UUID, Set<UUID>> prerequisitesByLesson = new HashMap<>();
        for (LessonPrerequisite relationship : prerequisiteRepository.findAllWithLessons()) {
            prerequisitesByLesson
                    .computeIfAbsent(relationship.getLesson().getId(), ignored -> new HashSet<>())
                    .add(relationship.getPrerequisiteLesson().getId());
        }

        Deque<UUID> pending = new ArrayDeque<>();
        Set<UUID> visited = new HashSet<>();
        pending.add(prerequisiteLessonId);
        while (!pending.isEmpty()) {
            UUID current = pending.removeFirst();
            if (!visited.add(current)) {
                continue;
            }
            if (current.equals(lessonId)) {
                throw new IllegalArgumentException("Lesson prerequisite would create a cycle");
            }
            pending.addAll(prerequisitesByLesson.getOrDefault(current, Set.of()));
        }
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

    private String generateUniqueSlug(String title) {
        for (int attempt = 0; attempt < 20; attempt++) {
            String slug = identityGenerator.slug(title, 220);
            if (!lessonRepository.existsBySlug(slug)) return slug;
        }
        throw new IllegalStateException("Could not generate a unique lesson slug");
    }

    private Lesson save(Lesson lesson, String slug) {
        try {
            return lessonRepository.saveAndFlush(lesson);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateLessonSlugException(slug);
        }
    }

    private static String normalizeSlug(String slug) {
        return Objects.requireNonNull(slug, "Slug is required")
                .strip()
                .toLowerCase(Locale.ROOT);
    }
}
