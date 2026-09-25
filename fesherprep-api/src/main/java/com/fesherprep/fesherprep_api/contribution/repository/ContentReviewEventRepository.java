package com.fesherprep.fesherprep_api.contribution.repository;

import com.fesherprep.fesherprep_api.contribution.domain.ContentReviewEvent;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ContentReviewEventRepository extends JpaRepository<ContentReviewEvent, UUID> {
    @EntityGraph(attributePaths = "actor")
    List<ContentReviewEvent> findAllBySubmissionIdOrderByCreatedAtAsc(UUID submissionId);
}
