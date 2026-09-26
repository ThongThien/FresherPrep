package com.fesherprep.fesherprep_api.quiz.service;

import com.fesherprep.fesherprep_api.config.CacheNames;
import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.lesson.domain.LessonProgress;
import com.fesherprep.fesherprep_api.lesson.repository.LessonProgressRepository;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.quiz.domain.*;
import com.fesherprep.fesherprep_api.quiz.dto.*;
import com.fesherprep.fesherprep_api.quiz.repository.*;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
public class QuizService {
    private final QuizRepository quizRepository;
    private final QuizFixedQuestionRepository fixedQuestionRepository;
    private final QuizRuleRepository ruleRepository;
    private final QuizAttemptRepository attemptRepository;
    private final QuizAttemptAnswerRepository answerRepository;
    private final QuizQuestionSelectionRepository questionRepository;
    private final LessonAssessmentRepository lessonAssessmentRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final Clock clock;

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<PublishedQuizResponse> getPublishedQuizzes(
            QuestionLanguage language,
            QuizCategory category,
            Pageable pageable
    ) {
        return quizRepository.findPublishedFiltered(ContentStatus.PUBLISHED, language, category, pageable)
                .map(PublishedQuizResponse::from);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheNames.QUIZ_DETAIL, key = "#quizId", sync = true)
    public PublishedQuizResponse getPublishedQuiz(UUID quizId) {
        return quizRepository
                .findPublishedProjectionByIdAndStatus(quizId, ContentStatus.PUBLISHED)
                .map(PublishedQuizResponse::from)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public PublishedQuizResponse getPublishedQuizByCode(String code) {
        String normalizedCode = normalizeCode(code);
        return PublishedQuizResponse.from(
                quizRepository.findPublishedProjectionByCodeAndStatus(normalizedCode, ContentStatus.PUBLISHED)
                        .orElseThrow(() -> new QuizNotFoundException(normalizedCode))
        );
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public QuizAttemptResponse startQuiz(UUID quizId) {
        User user = requireCurrentUserForUpdate();
        Quiz quiz = quizRepository.findForStart(quizId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
        requireAssessmentReading(user.getId(), quizId);
        Optional<QuizAttempt> activeAttempt = attemptRepository
                .findFirstByUserIdAndQuizIdAndStatusOrderByCreatedAtDesc(
                        user.getId(), quizId, AttemptStatus.IN_PROGRESS
                );
        if (activeAttempt.isPresent()) {
            return QuizAttemptResponse.from(activeAttempt.get());
        }
        List<QuestionVersion> versions = selectVersions(quiz);

        QuizAttempt attempt = attemptRepository.saveAndFlush(new QuizAttempt(user, quiz, versions));
        return QuizAttemptResponse.from(attempt);
    }

    private void requireAssessmentReading(UUID userId, UUID quizId) {
        List<LessonAssessment> assessments = lessonAssessmentRepository.findAllByQuizId(quizId);
        if (assessments.isEmpty()) {
            return;
        }
        boolean readingQualified = assessments.stream().anyMatch(assessment ->
                lessonProgressRepository
                        .findFirstByUserIdAndLessonId(userId, assessment.getLesson().getId())
                        .map(LessonProgress::getReadQualifiedAt)
                        .isPresent()
        );
        if (!readingQualified) {
            throw new IllegalStateException(
                    "Complete the lesson reading requirement before starting its assessment"
            );
        }
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public QuizAttemptResponse submitAttempt(UUID attemptId, @Valid SubmitQuizAttemptRequest request) {
        User user = requireCurrentUser();
        QuizAttempt attempt = requireOwnedAttemptForUpdate(attemptId, user.getId());
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            return QuizAttemptResponse.from(attempt);
        }

        Map<QuizAttemptQuestion, QuestionOption> selections = new LinkedHashMap<>();
        for (SubmitQuizAnswerRequest answer : request.answers()) {
            QuizAttemptQuestion attemptQuestion = attempt.getQuestions().stream()
                    .filter(question -> question.getId().equals(answer.attemptQuestionId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Question is not in this attempt"));
            QuestionOption option = attemptQuestion.getQuestionVersion().getOptions().stream()
                    .filter(candidate -> candidate.getId().equals(answer.optionId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Option is not in this attempt question"));
            if (selections.put(attemptQuestion, option) != null) {
                throw new IllegalArgumentException("Question was answered more than once");
            }
        }

        List<QuizAttemptQuestion> newlyAnswered = selections.keySet().stream()
                .filter(question -> question.getAnswer() == null)
                .toList();
        attempt.submit(selections, clock.instant());
        answerRepository.saveAll(newlyAnswered.stream()
                .map(QuizAttemptQuestion::getAnswer)
                .filter(Objects::nonNull)
                .toList());
        attemptRepository.flush();
        return QuizAttemptResponse.from(attempt);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public QuizAttemptResponse getMyAttempt(UUID attemptId) {
        User user = requireCurrentUser();
        QuizAttempt attempt = attemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new QuizAttemptNotFoundException(attemptId));
        return QuizAttemptResponse.from(attempt);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<QuizAttemptSummaryResponse> getMyAttemptHistory(Pageable pageable) {
        User user = requireCurrentUser();
        return attemptRepository.findAllByUserId(user.getId(), pageable)
                .map(QuizAttemptSummaryResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<QuizResponse> getAllQuizzes(
            QuestionLanguage language,
            QuizCategory category,
            ContentStatus status,
            Pageable pageable
    ) {
        return quizRepository.findAllFiltered(language, category, status, pageable).map(QuizResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public QuizResponse getQuiz(UUID quizId) {
        return QuizResponse.from(requireQuiz(quizId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse createQuiz(@Valid CreateQuizRequest request) {
        String code = normalizeCode(request.code());
        ensureUniqueCode(code, null);
        Quiz quiz = new Quiz(
                request.title(),
                code,
                request.type(),
                request.selectionMode(),
                request.passPercentage(),
                languageOrDefault(request.language()),
                categoryOrDefault(request.category()),
                scoreOrDefault(request.maximumScore()),
                request.durationSeconds()
        );
        return QuizResponse.from(saveQuiz(quiz, code));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse updateQuiz(UUID quizId, @Valid UpdateQuizRequest request) {
        Quiz quiz = requireQuiz(quizId);
        if (quizRepository.isUsedByLessonAssessment(quizId)
                && (request.type() != QuizType.LESSON
                || request.passPercentage() != LessonAssessment.PASS_PERCENTAGE)) {
            throw new IllegalStateException("A lesson assessment must remain a lesson quiz with an 80% pass threshold");
        }
        String code = normalizeCode(request.code());
        ensureUniqueCode(code, quizId);
        quiz.updateDetails(
                request.title(),
                code,
                request.type(),
                request.selectionMode(),
                request.passPercentage(),
                request.language() == null ? quiz.getLanguage() : request.language(),
                request.category() == null ? quiz.getCategory() : request.category(),
                request.maximumScore() == null ? quiz.getMaximumScore() : request.maximumScore(),
                request.durationSeconds()
        );
        return QuizResponse.from(saveQuiz(quiz, code));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse changeStatus(UUID quizId, @Valid ChangeQuizStatusRequest request) {
        Quiz quiz = requireQuiz(quizId);
        if (request.status() == ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Use publishQuiz to validate the quiz configuration");
        }
        quiz.changeStatus(request.status());
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse publishQuiz(UUID quizId) {
        Quiz quiz = requireQuiz(quizId);
        validatePublish(quiz);
        quiz.publish();
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse archiveQuiz(UUID quizId) {
        Quiz quiz = requireQuiz(quizId);
        quiz.archive();
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse addFixedQuestion(
            UUID quizId,
            @Valid AddFixedQuestionRequest request
    ) {
        Quiz quiz = requireQuiz(quizId);
        Question question = questionRepository.findById(request.questionId())
                .orElseThrow(() -> new IllegalArgumentException("Question does not exist"));
        quiz.addQuestion(question, request.position());
        QuizFixedQuestion added = quiz.getFixedQuestions().stream()
                .filter(item -> item.getQuestion().hasSameIdentityAs(question))
                .findFirst()
                .orElseThrow();
        fixedQuestionRepository.save(added);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse removeFixedQuestion(UUID quizId, UUID questionId) {
        Quiz quiz = requireQuiz(quizId);
        QuizFixedQuestion removed = quiz.removeQuestion(questionId);
        fixedQuestionRepository.delete(removed);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse addRule(UUID quizId, @Valid UpsertQuizRuleRequest request) {
        Quiz quiz = requireQuiz(quizId);
        KnowledgeNode node = requireKnowledgeNode(request.knowledgeNodeId());
        quiz.addRule(node, request.difficulty(), request.questionCount());
        QuizRule added = quiz.getRules().getLast();
        ruleRepository.save(added);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse updateRule(
            UUID quizId,
            UUID ruleId,
            @Valid UpsertQuizRuleRequest request
    ) {
        Quiz quiz = requireQuiz(quizId);
        KnowledgeNode node = requireKnowledgeNode(request.knowledgeNodeId());
        quiz.updateRule(ruleId, node, request.difficulty(), request.questionCount());
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public QuizResponse removeRule(UUID quizId, UUID ruleId) {
        Quiz quiz = requireQuiz(quizId);
        QuizRule removed = quiz.removeRule(ruleId);
        ruleRepository.delete(removed);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @CacheEvict(cacheNames = CacheNames.QUIZ_DETAIL, allEntries = true)
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = requireQuiz(quizId);
        if (quiz.getStatus() != ContentStatus.DRAFT && quiz.getStatus() != ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Only draft or archived quizzes can be deleted");
        }
        if (attemptRepository.existsByQuizId(quizId)) {
            throw new IllegalStateException("A quiz with attempt history cannot be deleted");
        }
        if (quizRepository.isUsedByLessonAssessment(quizId)) {
            throw new IllegalStateException("Remove the lesson assessment relationship first");
        }
        fixedQuestionRepository.deleteAllByQuizId(quizId);
        ruleRepository.deleteAllByQuizId(quizId);
        quizRepository.delete(quiz);
        quizRepository.flush();
    }

    private List<QuestionVersion> selectVersions(Quiz quiz) {
        if (quiz.getSelectionMode() == QuizSelectionMode.FIXED) {
            return selectFixedVersions(quiz);
        }
        return selectRuleBasedVersions(quiz);
    }

    private List<QuestionVersion> selectFixedVersions(Quiz quiz) {
        List<QuestionVersion> selected = new ArrayList<>();
        for (QuizFixedQuestion item : quiz.getFixedQuestions()) {
            Question question = item.getQuestion();
            if (!isEligibleQuestion(question, quiz)) {
                throw new IllegalStateException(
                        "Fixed quiz contains an unpublished or invalid question: " + question.getCode()
                );
            }
            selected.add(question.getPublishedVersion());
        }
        if (selected.isEmpty()) {
            throw new InsufficientQuizQuestionsException(1, 0);
        }
        return selected;
    }

    private List<QuestionVersion> selectRuleBasedVersions(Quiz quiz) {
        List<QuestionVersion> selected = new ArrayList<>();
        Set<UUID> selectedQuestionIds = new HashSet<>();
        for (QuizRule rule : quiz.getRules()) {
            List<Question> candidates = new ArrayList<>(eligibleQuestions(rule));
            candidates.removeIf(question -> selectedQuestionIds.contains(question.getId()));
            if (candidates.size() < rule.getQuestionCount()) {
                throw new InsufficientQuizQuestionsException(rule.getQuestionCount(), candidates.size());
            }
            Collections.shuffle(candidates);
            for (Question question : candidates.subList(0, rule.getQuestionCount())) {
                selectedQuestionIds.add(question.getId());
                selected.add(question.getPublishedVersion());
            }
        }
        if (selected.isEmpty()) {
            throw new InsufficientQuizQuestionsException(1, 0);
        }
        Collections.shuffle(selected);
        return selected;
    }

    private List<Question> eligibleQuestions(QuizRule rule) {
        Set<UUID> subtopicIds = findDescendantNodeIds(rule.getKnowledgeNode().getId());
        return questionRepository.findEligibleQuestions(
                subtopicIds,
                rule.getQuiz().getLanguage(),
                questionCategoryFilter(rule.getQuiz().getCategory()),
                rule.getDifficulty(),
                ContentStatus.PUBLISHED
        );
    }

    private Set<UUID> findDescendantNodeIds(UUID rootId) {
        Set<UUID> ids = new HashSet<>();
        Deque<UUID> pending = new ArrayDeque<>();
        pending.add(rootId);
        while (!pending.isEmpty()) {
            UUID current = pending.removeFirst();
            if (!ids.add(current)) {
                continue;
            }
            knowledgeNodeRepository.findAllByParentIdOrderByDisplayOrderAscNameAsc(current)
                    .forEach(child -> pending.addLast(child.getId()));
        }
        return ids;
    }

    private void validatePublish(Quiz quiz) {
        if (quiz.getSelectionMode() == QuizSelectionMode.FIXED) {
            if (quiz.getFixedQuestions().isEmpty()) {
                throw new IllegalStateException("A fixed quiz requires at least one question");
            }
            for (QuizFixedQuestion item : quiz.getFixedQuestions()) {
                if (!isEligibleQuestion(item.getQuestion(), quiz)) {
                    throw new IllegalStateException("Publish every fixed question and its subtopic first");
                }
            }
            return;
        }

        if (quiz.getRules().isEmpty()) {
            throw new IllegalStateException("A rule-based quiz requires at least one rule");
        }
        for (QuizRule rule : quiz.getRules()) {
            if (rule.getKnowledgeNode().getStatus() != ContentStatus.PUBLISHED) {
                throw new IllegalStateException("Publish every rule knowledge node first");
            }
            int available = eligibleQuestions(rule).size();
            if (available < rule.getQuestionCount()) {
                throw new InsufficientQuizQuestionsException(rule.getQuestionCount(), available);
            }
        }
    }

    private static boolean isEligibleQuestion(Question question, Quiz quiz) {
        return question.getStatus() == ContentStatus.PUBLISHED
                && question.getPublishedVersion() != null
                && question.getSubtopic().getStatus() == ContentStatus.PUBLISHED
                && question.getLanguage() == quiz.getLanguage()
                && (quiz.getCategory() == QuizCategory.MIXED
                || question.getCategory().name().equals(quiz.getCategory().name()));
    }

    private QuizAttempt requireOwnedAttemptForUpdate(UUID attemptId, UUID userId) {
        return attemptRepository.findOwnedForUpdate(attemptId, userId)
                .orElseThrow(() -> new QuizAttemptNotFoundException(attemptId));
    }

    private Quiz requirePublishedQuiz(UUID quizId) {
        return quizRepository.findByIdAndStatus(quizId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
    }

    private Quiz requireQuiz(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
    }

    private KnowledgeNode requireKnowledgeNode(UUID nodeId) {
        return knowledgeNodeRepository.findById(nodeId)
                .orElseThrow(() -> new IllegalArgumentException("Knowledge node does not exist"));
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

    private User requireCurrentUserForUpdate() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }
        try {
            return userRepository.findByIdForUpdate(UUID.fromString(authentication.getName()))
                    .orElseThrow(() -> new AuthenticationCredentialsNotFoundException(
                            "Authenticated user no longer exists"));
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }
    }

    private void ensureUniqueCode(String code, UUID currentQuizId) {
        boolean exists = currentQuizId == null
                ? quizRepository.existsByCode(code)
                : quizRepository.existsByCodeAndIdNot(code, currentQuizId);
        if (exists) {
            throw new DuplicateQuizCodeException(code);
        }
    }

    private Quiz saveQuiz(Quiz quiz, String code) {
        try {
            return quizRepository.saveAndFlush(quiz);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateQuizCodeException(code);
        }
    }

    private static String normalizeCode(String code) {
        return Objects.requireNonNull(code, "Quiz code is required")
                .strip()
                .toUpperCase(Locale.ROOT);
    }

    private static QuestionLanguage languageOrDefault(QuestionLanguage language) {
        return language == null ? QuestionLanguage.VI : language;
    }

    private static QuizCategory categoryOrDefault(QuizCategory category) {
        return category == null ? QuizCategory.TECHNICAL : category;
    }

    private static int scoreOrDefault(Integer maximumScore) {
        return maximumScore == null ? 100 : maximumScore;
    }

    private static QuestionCategory questionCategoryFilter(QuizCategory category) {
        return category == QuizCategory.MIXED ? null : QuestionCategory.valueOf(category.name());
    }
}
