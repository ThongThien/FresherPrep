package com.fesherprep.fesherprep_api.question.service;

import com.fesherprep.fesherprep_api.config.CacheNames;
import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.question.domain.Difficulty;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.question.dto.*;
import com.fesherprep.fesherprep_api.question.repository.QuestionRepository;
import com.fesherprep.fesherprep_api.question.repository.QuestionVersionRepository;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.*;

@Service
@Validated
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class QuestionService {
    private final QuestionRepository questionRepository;
    private final QuestionVersionRepository versionRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final ContentIdentityGenerator identityGenerator;
    private final QuestionBatchCreator batchCreator;

    @Transactional(readOnly = true)
    public Page<QuestionResponse> getAllQuestions(
            QuestionLanguage language,
            QuestionCategory category,
            UUID technologyId,
            UUID categoryNodeId,
            UUID topicId,
            UUID subtopicId,
            Difficulty difficulty,
            ContentStatus status,
            String query,
            Pageable pageable
    ) {
        return questionRepository.findAllFiltered(
                language,
                category,
                technologyId,
                categoryNodeId,
                topicId,
                subtopicId,
                difficulty,
                status,
                query == null ? "" : query.strip(),
                pageable
        ).map(QuestionResponse::from);
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(UUID questionId) {
        return QuestionResponse.from(requireQuestion(questionId));
    }

    @Transactional(readOnly = true)
    public List<QuestionVersionResponse> getVersions(UUID questionId) {
        requireQuestion(questionId);
        return versionRepository.findAllByQuestionIdOrderByVersionNumberDesc(questionId)
                .stream()
                .map(QuestionVersionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuestionVersionResponse getVersion(UUID questionId, UUID versionId) {
        return QuestionVersionResponse.from(requireVersion(questionId, versionId));
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionResponse createQuestion(@Valid CreateQuestionRequest request) {
        KnowledgeNode subtopic = requireSubtopic(request.subtopicId());
        String code = generateUniqueCode(subtopic.getSlug());

        Question question = new Question(
                subtopic,
                code,
                request.difficulty(),
                languageOrDefault(request.language()),
                categoryOrDefault(request.category())
        );
        return QuestionResponse.from(saveQuestion(question, code));
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public List<BatchCreatedQuestionResponse> createBatch(
            @Valid BatchCreateQuestionsRequest request
    ) {
        var createdQuestions = request.publish()
                ? batchCreator.createPublished(request)
                : batchCreator.create(request);
        return createdQuestions.stream()
                .map(created -> BatchCreatedQuestionResponse.from(
                        created.question(), created.version()))
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionResponse updateQuestion(UUID questionId, @Valid UpdateQuestionRequest request) {
        Question question = requireQuestion(questionId);
        KnowledgeNode subtopic = requireSubtopic(request.subtopicId());
        String code = question.getCode();

        if (question.getStatus() == ContentStatus.PUBLISHED
                && subtopic.getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("A published question requires a published subtopic");
        }

        question.updateMetadata(
                subtopic,
                code,
                request.difficulty(),
                request.language() == null ? question.getLanguage() : request.language(),
                request.category() == null ? question.getCategory() : request.category()
        );
        return QuestionResponse.from(saveQuestion(question, code));
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionResponse changeStatus(
            UUID questionId,
            @Valid ChangeQuestionStatusRequest request
    ) {
        Question question = requireQuestion(questionId);
        if (request.status() == ContentStatus.PUBLISHED) {
            throw new IllegalArgumentException("Publish a specific question version instead");
        }
        if (request.status() == ContentStatus.DRAFT
                && question.getStatus() == ContentStatus.PUBLISHED) {
            question.moveToDraftByAdministrator();
            return QuestionResponse.from(question);
        }
        question.changeStatus(request.status());
        return QuestionResponse.from(question);
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionVersionResponse createVersion(
            UUID questionId,
            @Valid CreateQuestionVersionRequest request
    ) {
        Question question = requireEditableQuestion(questionId);
        int expectedVersion = versionRepository.findMaxVersionNumber(questionId) + 1;
        if (request.versionNumber() != expectedVersion) {
            throw new IllegalArgumentException("Next question version number must be " + expectedVersion);
        }

        QuestionVersion version = buildVersion(
                question,
                request.versionNumber(),
                request.content(),
                request.explanation(),
                request.options()
        );
        QuestionVersion savedVersion = saveVersion(version);
        publishAdminVersionIfRequested(question, savedVersion, request.publish());
        return QuestionVersionResponse.from(savedVersion);
    }

    /**
     * Editing creates a new immutable version so existing quiz attempts keep their
     * original content and answers.
     */
    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionVersionResponse createRevision(
            UUID questionId,
            UUID versionId,
            @Valid UpdateQuestionVersionRequest request
    ) {
        QuestionVersion current = requireVersion(questionId, versionId);
        Question question = requireEditableQuestion(current.getQuestion().getId());
        int nextVersion = versionRepository.findMaxVersionNumber(question.getId()) + 1;

        QuestionVersion replacement = buildVersion(
                question,
                nextVersion,
                request.content(),
                request.explanation(),
                request.options()
        );
        QuestionVersion savedVersion = saveVersion(replacement);
        publishAdminVersionIfRequested(question, savedVersion, request.publish());
        return QuestionVersionResponse.from(savedVersion);
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public QuestionResponse publishVersion(UUID questionId, UUID versionId) {
        Question question = requireQuestion(questionId);
        if (question.getSubtopic().getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Publish the question subtopic first");
        }
        QuestionVersion version = requireVersion(questionId, versionId);
        question.publishByAdministrator(version);
        return QuestionResponse.from(question);
    }

    @Transactional
    @CacheEvict(cacheNames = { CacheNames.ADMIN_DASHBOARD, CacheNames.QUIZ_DETAIL,
            CacheNames.QUIZ_CATALOG }, allEntries = true)
    public void deleteQuestion(UUID questionId) {
        Question question = requireQuestion(questionId);
        if (question.getStatus() != ContentStatus.DRAFT
                && question.getStatus() != ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Only draft or archived questions can be deleted");
        }
        if (versionRepository.existsByQuestionId(questionId)) {
            throw new IllegalStateException("A question with version history cannot be deleted");
        }
        if (questionRepository.isUsedByFixedQuiz(questionId)) {
            throw new IllegalStateException("Remove the question from fixed quizzes first");
        }
        questionRepository.delete(question);
        questionRepository.flush();
    }

    private QuestionVersion buildVersion(
            Question question,
            int versionNumber,
            String content,
            String explanation,
            List<QuestionOptionRequest> optionRequests
    ) {
        List<QuestionOptionRequest> options = validateAndSortOptions(optionRequests);
        List<QuestionVersion.OptionDefinition> definitions = options.stream()
                .map(option -> new QuestionVersion.OptionDefinition(
                        option.content(),
                        option.correct(),
                        option.explanation()
                ))
                .toList();
        return new QuestionVersion(question, versionNumber, content, explanation, definitions);
    }

    private static List<QuestionOptionRequest> validateAndSortOptions(
            List<QuestionOptionRequest> optionRequests
    ) {
        Objects.requireNonNull(optionRequests, "Question options are required");
        List<QuestionOptionRequest> options = optionRequests.stream()
                .sorted(Comparator.comparingInt(QuestionOptionRequest::position))
                .toList();

        if (options.size() != 4) {
            throw new IllegalArgumentException("A question version must contain exactly four options");
        }
        for (int index = 0; index < options.size(); index++) {
            if (options.get(index).position() != index + 1) {
                throw new IllegalArgumentException("Option positions must be unique and cover 1 through 4");
            }
        }
        if (options.stream().filter(QuestionOptionRequest::correct).count() != 1) {
            throw new IllegalArgumentException("A question version must have exactly one correct option");
        }
        return options;
    }

    private Question requireEditableQuestion(UUID questionId) {
        Question question = requireQuestion(questionId);
        if (question.getStatus() == ContentStatus.ARCHIVED) {
            throw new IllegalStateException("Move the archived question to draft before creating a version");
        }
        return question;
    }

    private Question requireQuestion(UUID questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new QuestionNotFoundException(questionId));
    }

    private QuestionVersion requireVersion(UUID questionId, UUID versionId) {
        return versionRepository.findByIdAndQuestionId(versionId, questionId)
                .orElseThrow(() -> new QuestionVersionNotFoundException(versionId));
    }

    private KnowledgeNode requireSubtopic(UUID subtopicId) {
        KnowledgeNode node = knowledgeNodeRepository.findById(subtopicId)
                .orElseThrow(() -> new IllegalArgumentException("Subtopic does not exist"));
        if (node.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("Question must belong to a subtopic");
        }
        return node;
    }

    private String generateUniqueCode(String subtopicSlug) {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = identityGenerator.code(subtopicSlug, 50);
            if (!questionRepository.existsByCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique question code");
    }

    private Question saveQuestion(Question question, String code) {
        try {
            return questionRepository.saveAndFlush(question);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateQuestionCodeException(code);
        }
    }

    private QuestionVersion saveVersion(QuestionVersion version) {
        try {
            return versionRepository.saveAndFlush(version);
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException("Question version number already exists", exception);
        }
    }

    private static void publishAdminVersionIfRequested(
            Question question,
            QuestionVersion version,
            boolean publish
    ) {
        if (!publish) return;
        if (question.getSubtopic().getStatus() != ContentStatus.PUBLISHED) {
            throw new IllegalStateException("Publish the question subtopic first");
        }
        question.publishByAdministrator(version);
    }

    private static QuestionLanguage languageOrDefault(QuestionLanguage language) {
        return language == null ? QuestionLanguage.VI : language;
    }

    private static QuestionCategory categoryOrDefault(QuestionCategory category) {
        return category == null ? QuestionCategory.TECHNICAL : category;
    }
}
