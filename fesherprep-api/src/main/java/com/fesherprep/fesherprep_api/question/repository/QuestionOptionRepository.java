package com.fesherprep.fesherprep_api.question.repository;

import com.fesherprep.fesherprep_api.question.domain.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {
    List<QuestionOption> findAllByQuestionVersionIdOrderByPositionAsc(UUID questionVersionId);
}
