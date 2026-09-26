package com.fesherprep.fesherprep_api.question.service;

import com.fesherprep.fesherprep_api.knowledge.domain.KnowledgeNode;
import com.fesherprep.fesherprep_api.knowledge.domain.NodeType;
import com.fesherprep.fesherprep_api.knowledge.repository.KnowledgeNodeRepository;
import com.fesherprep.fesherprep_api.question.domain.Question;
import com.fesherprep.fesherprep_api.question.domain.QuestionCategory;
import com.fesherprep.fesherprep_api.question.domain.QuestionLanguage;
import com.fesherprep.fesherprep_api.question.domain.QuestionVersion;
import com.fesherprep.fesherprep_api.question.dto.BatchCreateQuestionsRequest;
import com.fesherprep.fesherprep_api.question.dto.BatchQuestionItemRequest;
import com.fesherprep.fesherprep_api.question.dto.QuestionOptionRequest;
import com.fesherprep.fesherprep_api.question.repository.QuestionRepository;
import com.fesherprep.fesherprep_api.question.repository.QuestionVersionRepository;
import com.fesherprep.fesherprep_api.shared.util.ContentIdentityGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionBatchCreator {
    private final QuestionRepository questionRepository;
    private final QuestionVersionRepository versionRepository;
    private final KnowledgeNodeRepository knowledgeNodeRepository;
    private final ContentIdentityGenerator identityGenerator;

    @Transactional(propagation = Propagation.MANDATORY)
    public List<CreatedQuestion> create(BatchCreateQuestionsRequest request) {
        KnowledgeNode subtopic = knowledgeNodeRepository.findById(request.subtopicId())
                .orElseThrow(() -> new IllegalArgumentException("Subtopic does not exist"));
        if (subtopic.getType() != NodeType.SUBTOPIC) {
            throw new IllegalArgumentException("Question must belong to a subtopic");
        }

        QuestionLanguage language = request.language() == null ? QuestionLanguage.VI : request.language();
        QuestionCategory category = request.category() == null
                ? QuestionCategory.TECHNICAL : request.category();
        List<CreatedQuestion> created = new ArrayList<>(request.questions().size());

        for (BatchQuestionItemRequest item : request.questions()) {
            String code = uniqueCode(subtopic.getSlug());
            Question question = saveQuestion(new Question(
                    subtopic, code, item.difficulty(), language, category), code);
            QuestionVersion version = new QuestionVersion(
                    question, 1, item.content(), item.explanation(), optionDefinitions(item.options()));
            created.add(new CreatedQuestion(question, saveVersion(version)));
        }
        return List.copyOf(created);
    }

    private List<QuestionVersion.OptionDefinition> optionDefinitions(List<QuestionOptionRequest> requests) {
        List<QuestionOptionRequest> sorted = requests.stream()
                .sorted(Comparator.comparingInt(QuestionOptionRequest::position))
                .toList();
        if (sorted.size() != 4) {
            throw new IllegalArgumentException("A question version must contain exactly four options");
        }
        for (int index = 0; index < sorted.size(); index++) {
            if (sorted.get(index).position() != index + 1) {
                throw new IllegalArgumentException("Option positions must be unique and cover 1 through 4");
            }
        }
        if (sorted.stream().filter(QuestionOptionRequest::correct).count() != 1) {
            throw new IllegalArgumentException("A question version must have exactly one correct option");
        }
        return sorted.stream().map(option -> new QuestionVersion.OptionDefinition(
                option.content(), option.correct(), option.explanation())).toList();
    }

    private String uniqueCode(String subtopicSlug) {
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

    public record CreatedQuestion(Question question, QuestionVersion version) {
    }
}
