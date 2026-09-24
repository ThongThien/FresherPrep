package com.fesherprep.fesherprep_api.quiz.service;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
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
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public Page<PublishedQuizResponse> getPublishedQuizzes(Pageable pageable) {
        return quizRepository.findAllByStatus(ContentStatus.PUBLISHED, pageable)
                .map(PublishedQuizResponse::from);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public PublishedQuizResponse getPublishedQuiz(UUID quizId) {
        return PublishedQuizResponse.from(requirePublishedQuiz(quizId));
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional(readOnly = true)
    public PublishedQuizResponse getPublishedQuizByCode(String code) {
        String normalizedCode = normalizeCode(code);
        return PublishedQuizResponse.from(
                quizRepository.findByCodeAndStatus(normalizedCode, ContentStatus.PUBLISHED)
                        .orElseThrow(() -> new QuizNotFoundException(normalizedCode))
        );
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public QuizAttemptResponse startQuiz(UUID quizId) {
        User user = requireCurrentUser();
        Quiz quiz = quizRepository.findForStart(quizId, ContentStatus.PUBLISHED)
                .orElseThrow(() -> new QuizNotFoundException(quizId));
        List<QuestionVersion> versions = selectVersions(quiz);

        QuizAttempt attempt = attemptRepository.saveAndFlush(new QuizAttempt(user, quiz, versions));
        return QuizAttemptResponse.from(attempt);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public QuizAttemptResponse submitAnswer(
            UUID attemptId,
            @Valid SubmitQuizAnswerRequest request
    ) {
        User user = requireCurrentUser();
        QuizAttempt attempt = requireOwnedAttemptForUpdate(attemptId, user.getId());
        QuizAttemptQuestion attemptQuestion = attempt.getQuestions().stream()
                .filter(question -> question.getId().equals(request.attemptQuestionId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Question is not in this attempt"));
        QuestionOption option = attemptQuestion.getQuestionVersion().getOptions().stream()
                .filter(candidate -> candidate.getId().equals(request.optionId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Option is not in this attempt question"));

        attempt.recordAnswer(attemptQuestion, option);
        answerRepository.saveAndFlush(attemptQuestion.getAnswer());
        return QuizAttemptResponse.from(attempt);
    }

    @PreAuthorize("isAuthenticated()")
    @Transactional
    public QuizAttemptResponse submitAttempt(UUID attemptId) {
        User user = requireCurrentUser();
        QuizAttempt attempt = requireOwnedAttemptForUpdate(attemptId, user.getId());
        attempt.submit(clock.instant());
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
    public Page<QuizResponse> getAllQuizzes(Pageable pageable) {
        return quizRepository.findAll(pageable).map(QuizResponse::from);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public QuizResponse getQuiz(UUID quizId) {
        return QuizResponse.from(requireQuiz(quizId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public QuizResponse createQuiz(@Valid CreateQuizRequest request) {
        String code = normalizeCode(request.code());
        ensureUniqueCode(code, null);
        Quiz quiz = new Quiz(
                request.title(),
                code,
                request.type(),
                request.selectionMode(),
                request.passPercentage()
        );
        return QuizResponse.from(saveQuiz(quiz, code));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public QuizResponse updateQuiz(UUID quizId, @Valid UpdateQuizRequest request) {
        Quiz quiz = requireQuiz(quizId);
        String code = normalizeCode(request.code());
        ensureUniqueCode(code, quizId);
        quiz.updateDetails(
                request.title(),
                code,
                request.type(),
                request.selectionMode(),
                request.passPercentage()
        );
        return QuizResponse.from(saveQuiz(quiz, code));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
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
    public QuizResponse publishQuiz(UUID quizId) {
        Quiz quiz = requireQuiz(quizId);
        validatePublish(quiz);
        quiz.publish();
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public QuizResponse archiveQuiz(UUID quizId) {
        Quiz quiz = requireQuiz(quizId);
        quiz.archive();
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
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
    public QuizResponse removeFixedQuestion(UUID quizId, UUID questionId) {
        Quiz quiz = requireQuiz(quizId);
        QuizFixedQuestion removed = quiz.removeQuestion(questionId);
        fixedQuestionRepository.delete(removed);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
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
    public QuizResponse removeRule(UUID quizId, UUID ruleId) {
        Quiz quiz = requireQuiz(quizId);
        QuizRule removed = quiz.removeRule(ruleId);
        ruleRepository.delete(removed);
        return QuizResponse.from(quiz);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
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
            if (!isEligibleQuestion(question)) {
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
                if (!isEligibleQuestion(item.getQuestion())) {
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

    private static boolean isEligibleQuestion(Question question) {
        return question.getStatus() == ContentStatus.PUBLISHED
                && question.getPublishedVersion() != null
                && question.getSubtopic().getStatus() == ContentStatus.PUBLISHED;
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
}
