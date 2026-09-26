package com.fesherprep.fesherprep_api.contribution.service;

import com.fesherprep.fesherprep_api.contribution.domain.*;
import com.fesherprep.fesherprep_api.contribution.dto.*;
import com.fesherprep.fesherprep_api.contribution.repository.*;
import com.fesherprep.fesherprep_api.knowledge.domain.*;
import com.fesherprep.fesherprep_api.knowledge.dto.KnowledgeNodeResponse;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.lesson.domain.Lesson;
import com.fesherprep.fesherprep_api.lesson.dto.*;
import com.fesherprep.fesherprep_api.lesson.repository.LessonPrerequisiteRepository;
import com.fesherprep.fesherprep_api.lesson.repository.LessonRepository;
import com.fesherprep.fesherprep_api.lesson.service.LessonService;
import com.fesherprep.fesherprep_api.question.domain.*;
import com.fesherprep.fesherprep_api.question.dto.*;
import com.fesherprep.fesherprep_api.question.repository.*;
import com.fesherprep.fesherprep_api.question.service.QuestionService;
import com.fesherprep.fesherprep_api.question.service.QuestionBatchCreator;
import com.fesherprep.fesherprep_api.quiz.domain.*;
import com.fesherprep.fesherprep_api.quiz.dto.*;
import com.fesherprep.fesherprep_api.quiz.repository.*;
import com.fesherprep.fesherprep_api.quiz.service.QuizService;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.*;
import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
public class ContributionService {
    private final ContentSubmissionRepository submissionRepository;
    private final ContentReviewEventRepository eventRepository;
    private final LessonRepository lessonRepository;
    private final LessonPrerequisiteRepository prerequisiteRepository;
    private final LessonAssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final QuestionVersionRepository versionRepository;
    private final QuizRepository quizRepository;
    private final QuizFixedQuestionRepository fixedQuestionRepository;
    private final QuizRuleRepository ruleRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final UserRepository userRepository;
    private final LessonService lessonService;
    private final QuestionService questionService;
    private final QuizService quizService;
    private final ContentIdentityGenerator identityGenerator;
    private final QuestionBatchCreator questionBatchCreator;
    private final Clock clock;

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional(readOnly = true)
    public List<KnowledgeNodeResponse> availableKnowledgeNodes() {
        return knowledgeNodeRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(KnowledgeNodeResponse::from)
                .toList();
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional(readOnly = true)
    public Page<QuestionResponse> availableQuestions(
            QuestionLanguage language,
            QuestionCategory category,
            UUID knowledgeNodeId,
            Difficulty difficulty,
            Pageable pageable
    ) {
        return questionRepository.findAllFiltered(
                language, category, knowledgeNodeId, difficulty,
                ContentStatus.PUBLISHED, pageable).map(QuestionResponse::from);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional(readOnly = true)
    public Page<ContributionSummaryResponse> myContributions(
            ContributionContentType type, ReviewStatus status, Pageable pageable
    ) {
        return submissionRepository.findOwned(currentUser().getId(), type, status, pageable)
                .map(ContributionSummaryResponse::from);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional(readOnly = true)
    public ContributionDetailResponse myContribution(UUID id) {
        return detail(requireOwned(id, currentUser()));
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse createLesson(@Valid CreateLessonRequest request) {
        User owner = currentUser();
        Lesson lesson = lessonRepository.saveAndFlush(new Lesson(
                requireSubtopic(request.subtopicId()), request.title(), uniqueLessonSlug(request.title()),
                request.content(), request.displayOrder(), request.minimumReadSeconds(),
                request.requiredScrollPercent()
        ));
        return detail(createSubmission(ContributionContentType.LESSON, lesson.getId(), lesson.getTitle(), owner));
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse updateLesson(UUID lessonId, @Valid UpdateLessonRequest request) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.LESSON, lessonId, owner);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ContributionNotFoundException(submission.getId()));
        if (lesson.getStatus() != ContentStatus.DRAFT) {
            throw new IllegalStateException("Published lessons cannot be edited by a contributor");
        }
        lesson.assignSubtopic(requireSubtopic(request.subtopicId()));
        lesson.updateContent(request.title(), lesson.getSlug(), request.content(), request.displayOrder());
        lesson.configureReading(request.minimumReadSeconds(), request.requiredScrollPercent());
        submission.rename(lesson.getTitle());
        record(submission, owner, ReviewAction.EDITED, null);
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse createQuestion(@Valid CreateQuestionRequest request) {
        User owner = currentUser();
        KnowledgeNode subtopic = requireSubtopic(request.subtopicId());
        String code = uniqueQuestionCode(subtopic.getSlug());
        Question question = questionRepository.saveAndFlush(new Question(
                subtopic, code, request.difficulty(),
                request.language() == null ? QuestionLanguage.VI : request.language(),
                request.category() == null ? QuestionCategory.TECHNICAL : request.category()
        ));
        return detail(createSubmission(ContributionContentType.QUESTION, question.getId(), code, owner));
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public List<ContributionDetailResponse> createQuestionsBatch(
            @Valid BatchCreateQuestionsRequest request
    ) {
        User owner = currentUser();
        return questionBatchCreator.create(request).stream()
                .map(created -> detail(createSubmission(
                        ContributionContentType.QUESTION,
                        created.question().getId(),
                        shortTitle(created.version().getContent()),
                        owner)))
                .toList();
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse updateQuestion(UUID id, @Valid UpdateQuestionRequest request) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUESTION, id, owner);
        Question question = requireQuestion(id);
        if (question.getStatus() != ContentStatus.DRAFT) {
            throw new IllegalStateException("Published question metadata cannot be edited by a contributor");
        }
        question.updateMetadata(
                requireSubtopic(request.subtopicId()), question.getCode(), request.difficulty(),
                request.language() == null ? question.getLanguage() : request.language(),
                request.category() == null ? question.getCategory() : request.category()
        );
        record(submission, owner, ReviewAction.EDITED, null);
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse createQuestionVersion(
            UUID questionId, @Valid CreateQuestionVersionRequest request
    ) {
        User owner = currentUser();
        ContentSubmission submission = requireOwned(ContributionContentType.QUESTION, questionId, owner);
        if (submission.getStatus() == ReviewStatus.PUBLISHED) {
            submission.beginPublishedQuestionRevision();
        } else {
            submission.beginEditing();
        }
        Question question = requireQuestion(questionId);
        int nextVersion = versionRepository.findMaxVersionNumber(questionId) + 1;
        if (request.versionNumber() != nextVersion) {
            throw new IllegalArgumentException("Next question version number must be " + nextVersion);
        }
        QuestionVersion version = new QuestionVersion(
                question, nextVersion, request.content(), request.explanation(),
                optionDefinitions(request.options())
        );
        versionRepository.saveAndFlush(version);
        submission.rename(shortTitle(request.content()));
        record(submission, owner, ReviewAction.EDITED, "Created question version " + nextVersion);
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse createQuiz(@Valid ContributorQuizRequest request) {
        User owner = currentUser();
        String code = uniqueQuizCode(request.title());
        Quiz quiz = quizRepository.saveAndFlush(new Quiz(
                request.title(), code, request.type(), request.selectionMode(), request.passPercentage(),
                request.language() == null ? QuestionLanguage.VI : request.language(),
                request.category() == null ? QuizCategory.TECHNICAL : request.category(),
                request.maximumScore() == null ? 100 : request.maximumScore(),
                request.durationSeconds()
        ));
        return detail(createSubmission(ContributionContentType.QUIZ, quiz.getId(), quiz.getTitle(), owner));
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse updateQuiz(UUID id, @Valid ContributorQuizRequest request) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, id, owner);
        Quiz quiz = requireQuiz(id);
        if (quiz.getStatus() != ContentStatus.DRAFT) {
            throw new IllegalStateException("Published quizzes cannot be edited by a contributor");
        }
        quiz.updateDetails(
                request.title(), quiz.getCode(), request.type(), request.selectionMode(),
                request.passPercentage(),
                request.language() == null ? quiz.getLanguage() : request.language(),
                request.category() == null ? quiz.getCategory() : request.category(),
                request.maximumScore() == null ? quiz.getMaximumScore() : request.maximumScore(),
                request.durationSeconds()
        );
        submission.rename(quiz.getTitle());
        record(submission, owner, ReviewAction.EDITED, null);
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse addFixedQuestion(UUID quizId, @Valid AddFixedQuestionRequest request) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        Quiz quiz = requireQuiz(quizId);
        Question question = requirePublishedQuestion(request.questionId());
        quiz.addQuestion(question, request.position());
        fixedQuestionRepository.save(quiz.getFixedQuestions().stream()
                .filter(item -> item.getQuestion().hasSameIdentityAs(question)).findFirst().orElseThrow());
        record(submission, owner, ReviewAction.EDITED, "Updated fixed quiz questions");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse addFixedQuestions(
            UUID quizId, @Valid AddFixedQuestionsRequest request
    ) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        Quiz quiz = requireQuiz(quizId);
        int nextPosition = quiz.getFixedQuestions().stream()
                .mapToInt(QuizFixedQuestion::getPosition)
                .max().orElse(0) + 1;
        List<QuizFixedQuestion> added = new ArrayList<>();
        for (UUID questionId : request.questionIds()) {
            Question question = requirePublishedQuestion(questionId);
            quiz.addQuestion(question, nextPosition++);
            added.add(quiz.getFixedQuestions().stream()
                    .filter(item -> item.getQuestion().hasSameIdentityAs(question))
                    .findFirst().orElseThrow());
        }
        fixedQuestionRepository.saveAll(added);
        record(submission, owner, ReviewAction.EDITED, "Added fixed quiz questions");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse removeFixedQuestion(UUID quizId, UUID questionId) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        QuizFixedQuestion removed = requireQuiz(quizId).removeQuestion(questionId);
        fixedQuestionRepository.delete(removed);
        record(submission, owner, ReviewAction.EDITED, "Updated fixed quiz questions");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse addRule(UUID quizId, @Valid UpsertQuizRuleRequest request) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        Quiz quiz = requireQuiz(quizId);
        KnowledgeNode node = knowledgeNodeRepository.findById(request.knowledgeNodeId())
                .orElseThrow(() -> new IllegalArgumentException("Knowledge node does not exist"));
        quiz.addRule(node, request.difficulty(), request.questionCount());
        ruleRepository.save(quiz.getRules().getLast());
        record(submission, owner, ReviewAction.EDITED, "Updated quiz selection rules");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse updateRule(
            UUID quizId, UUID ruleId, @Valid UpsertQuizRuleRequest request
    ) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        KnowledgeNode node = knowledgeNodeRepository.findById(request.knowledgeNodeId())
                .orElseThrow(() -> new IllegalArgumentException("Knowledge node does not exist"));
        requireQuiz(quizId).updateRule(ruleId, node, request.difficulty(), request.questionCount());
        record(submission, owner, ReviewAction.EDITED, "Updated quiz selection rules");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse removeRule(UUID quizId, UUID ruleId) {
        User owner = currentUser();
        ContentSubmission submission = editable(ContributionContentType.QUIZ, quizId, owner);
        QuizRule removed = requireQuiz(quizId).removeRule(ruleId);
        ruleRepository.delete(removed);
        record(submission, owner, ReviewAction.EDITED, "Updated quiz selection rules");
        return detail(submission);
    }

    @PreAuthorize("hasRole('CONTRIBUTOR')")
    @Transactional
    public ContributionDetailResponse submit(UUID id) {
        User owner = currentUser();
        ContentSubmission submission = requireOwned(id, owner);
        prepareForReview(submission);
        submission.submit(clock.instant());
        record(submission, owner, ReviewAction.SUBMITTED, null);
        return detail(submission);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<ContributionSummaryResponse> reviewQueue(
            ContributionContentType type, ReviewStatus status, String contributor,
            Instant from, Instant to, Pageable pageable
    ) {
        ReviewStatus effective = status == null ? ReviewStatus.PENDING_REVIEW : status;
        String query = contributor == null || contributor.isBlank() ? null : contributor.strip();
        return submissionRepository.findForReview(type, effective, query, from, to, pageable)
                .map(ContributionSummaryResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ContributionDetailResponse reviewDetail(UUID id) {
        return detail(requireSubmission(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ContributionDetailResponse approve(UUID id) {
        User reviewer = currentUser();
        ContentSubmission submission = requireSubmissionForUpdate(id);
        preventSelfReview(submission, reviewer);
        publishContent(submission);
        record(submission, reviewer, ReviewAction.APPROVED, null);
        submission.publish(reviewer, clock.instant());
        record(submission, reviewer, ReviewAction.PUBLISHED, null);
        return detail(submission);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ContributionDetailResponse reject(UUID id, @Valid RejectContentRequest request) {
        User reviewer = currentUser();
        ContentSubmission submission = requireSubmissionForUpdate(id);
        preventSelfReview(submission, reviewer);
        returnToDraft(submission);
        submission.reject(reviewer, request.reason(), clock.instant());
        record(submission, reviewer, ReviewAction.REJECTED, request.reason());
        return detail(submission);
    }

    private void prepareForReview(ContentSubmission submission) {
        switch (submission.getContentType()) {
            case LESSON -> {
                Lesson lesson = lessonRepository.findById(submission.getContentId())
                        .orElseThrow(() -> new ContributionNotFoundException(submission.getId()));
                if (lesson.getStatus() != ContentStatus.DRAFT) {
                    throw new IllegalStateException("Lesson is not an editable draft");
                }
                lesson.changeStatus(ContentStatus.REVIEW);
            }
            case QUESTION -> {
                Question question = requireQuestion(submission.getContentId());
                if (!versionRepository.existsByQuestionId(question.getId())) {
                    throw new IllegalStateException("Create a valid question version before review");
                }
                if (question.getStatus() == ContentStatus.DRAFT) {
                    question.submitForReview();
                } else if (question.getStatus() != ContentStatus.PUBLISHED) {
                    throw new IllegalStateException("Question cannot enter review from its current state");
                }
            }
            case QUIZ -> requireQuiz(submission.getContentId()).submitForReview();
        }
    }

    private void publishContent(ContentSubmission submission) {
        if (submission.getStatus() != ReviewStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Only pending content can be approved");
        }
        switch (submission.getContentType()) {
            case LESSON -> lessonService.publishLesson(submission.getContentId());
            case QUESTION -> {
                QuestionVersion latest = versionRepository
                        .findAllByQuestionIdOrderByVersionNumberDesc(submission.getContentId())
                        .stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("Question has no version to publish"));
                questionService.publishVersion(submission.getContentId(), latest.getId());
            }
            case QUIZ -> quizService.publishQuiz(submission.getContentId());
        }
    }

    private void returnToDraft(ContentSubmission submission) {
        if (submission.getStatus() != ReviewStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Only pending content can be rejected");
        }
        switch (submission.getContentType()) {
            case LESSON -> lessonRepository.findById(submission.getContentId())
                    .orElseThrow(() -> new ContributionNotFoundException(submission.getId()))
                    .changeStatus(ContentStatus.DRAFT);
            case QUESTION -> {
                Question question = requireQuestion(submission.getContentId());
                if (question.getStatus() == ContentStatus.REVIEW) {
                    question.changeStatus(ContentStatus.DRAFT);
                }
            }
            case QUIZ -> requireQuiz(submission.getContentId()).changeStatus(ContentStatus.DRAFT);
        }
    }

    private ContributionDetailResponse detail(ContentSubmission submission) {
        Object content = switch (submission.getContentType()) {
            case LESSON -> lessonContent(submission);
            case QUESTION -> Map.of(
                    "question", QuestionResponse.from(requireQuestion(submission.getContentId())),
                    "versions", versionRepository
                            .findAllByQuestionIdOrderByVersionNumberDesc(submission.getContentId())
                            .stream().map(QuestionVersionResponse::from).toList());
            case QUIZ -> QuizResponse.from(requireQuiz(submission.getContentId()));
        };
        return new ContributionDetailResponse(
                ContributionSummaryResponse.from(submission), content,
                eventRepository.findAllBySubmissionIdOrderByCreatedAtAsc(submission.getId())
                        .stream().map(ReviewHistoryResponse::from).toList());
    }

    private Map<String, Object> lessonContent(ContentSubmission submission) {
        Lesson lesson = lessonRepository.findById(submission.getContentId())
                .orElseThrow(() -> new ContributionNotFoundException(submission.getId()));
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("lesson", LessonDetailResponse.from(
                lesson,
                prerequisiteRepository.findAllForLesson(lesson.getId()).stream()
                        .map(item -> LessonSummaryResponse.from(item.getPrerequisiteLesson()))
                        .toList()
        ));
        assessmentRepository.findByLessonId(lesson.getId())
                .ifPresent(assessment -> content.put(
                        "assessment", LessonAssessmentResponse.from(assessment)));
        return content;
    }

    private ContentSubmission createSubmission(
            ContributionContentType type, UUID contentId, String title, User owner
    ) {
        ContentSubmission submission = submissionRepository.saveAndFlush(
                new ContentSubmission(type, contentId, title, owner));
        record(submission, owner, ReviewAction.CREATED, null);
        return submission;
    }

    private ContentSubmission editable(ContributionContentType type, UUID contentId, User owner) {
        ContentSubmission submission = requireOwned(type, contentId, owner);
        submission.beginEditing();
        return submission;
    }

    private ContentSubmission requireOwned(UUID id, User owner) {
        ContentSubmission submission = requireSubmission(id);
        requireOwner(submission, owner);
        return submission;
    }

    private ContentSubmission requireOwned(
            ContributionContentType type, UUID contentId, User owner
    ) {
        ContentSubmission submission = submissionRepository
                .findByContentTypeAndContentId(type, contentId)
                .orElseThrow(() -> new ContributionNotFoundException(contentId));
        requireOwner(submission, owner);
        return submission;
    }

    private static void requireOwner(ContentSubmission submission, User owner) {
        if (!submission.getSubmittedBy().hasSameIdentityAs(owner)) {
            throw new AccessDeniedException("You can only modify your own contributions");
        }
    }

    private static void preventSelfReview(ContentSubmission submission, User reviewer) {
        if (submission.getSubmittedBy().hasSameIdentityAs(reviewer)) {
            throw new AccessDeniedException("A contributor cannot review their own submission");
        }
    }

    private ContentSubmission requireSubmission(UUID id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new ContributionNotFoundException(id));
    }

    private ContentSubmission requireSubmissionForUpdate(UUID id) {
        return submissionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ContributionNotFoundException(id));
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        try {
            return userRepository.findById(UUID.fromString(auth.getName()))
                    .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                            "Authenticated user no longer exists"));
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
    }

    private KnowledgeNode requireSubtopic(UUID id) {
        KnowledgeNode node = knowledgeNodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subtopic does not exist"));
        if (node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("Content must belong to a subtopic");
        }
        return node;
    }

    private Question requireQuestion(UUID id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ContributionNotFoundException(id));
    }

    private Question requirePublishedQuestion(UUID id) {
        Question question = requireQuestion(id);
        if (question.getStatus() != ContentStatus.PUBLISHED
                || question.getPublishedVersion() == null) {
            throw new IllegalArgumentException("A fixed quiz can only use a published question");
        }
        return question;
    }

    private Quiz requireQuiz(UUID id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ContributionNotFoundException(id));
    }

    private void record(ContentSubmission submission, User actor, ReviewAction action, String comment) {
        eventRepository.save(new ContentReviewEvent(submission, actor, action, comment));
    }

    private String uniqueLessonSlug(String title) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String value = identityGenerator.slug(title, 220);
            if (!lessonRepository.existsBySlug(value)) return value;
        }
        throw new IllegalStateException("Could not generate a unique lesson slug");
    }

    private String uniqueQuestionCode(String scope) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String value = identityGenerator.code(scope, 50);
            if (!questionRepository.existsByCode(value)) return value;
        }
        throw new IllegalStateException("Could not generate a unique question code");
    }

    private String uniqueQuizCode(String title) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String value = identityGenerator.code(title, 50);
            if (!quizRepository.existsByCode(value)) return value;
        }
        throw new IllegalStateException("Could not generate a unique quiz code");
    }

    private static List<QuestionVersion.OptionDefinition> optionDefinitions(
            List<QuestionOptionRequest> requests
    ) {
        List<QuestionOptionRequest> sorted = requests.stream()
                .sorted(Comparator.comparingInt(QuestionOptionRequest::position)).toList();
        if (sorted.size() != 4 || sorted.stream().filter(QuestionOptionRequest::correct).count() != 1) {
            throw new IllegalArgumentException("A question version needs four options and one correct answer");
        }
        for (int index = 0; index < sorted.size(); index++) {
            if (sorted.get(index).position() != index + 1) {
                throw new IllegalArgumentException("Option positions must cover 1 through 4");
            }
        }
        return sorted.stream().map(option -> new QuestionVersion.OptionDefinition(
                option.content(), option.correct(), option.explanation())).toList();
    }

    private static String shortTitle(String content) {
        String value = content.strip().replaceAll("\\s+", " ");
        return value.length() <= 200 ? value : value.substring(0, 197) + "...";
    }
}
