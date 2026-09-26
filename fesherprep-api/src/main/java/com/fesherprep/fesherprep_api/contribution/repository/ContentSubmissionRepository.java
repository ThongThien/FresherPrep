package com.fesherprep.fesherprep_api.contribution.repository;

import com.fesherprep.fesherprep_api.contribution.domain.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface ContentSubmissionRepository extends JpaRepository<ContentSubmission, UUID>,
        JpaSpecificationExecutor<ContentSubmission> {
    @Override
    @EntityGraph(attributePaths = {"submittedBy", "reviewedBy"})
    Optional<ContentSubmission> findById(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"submittedBy", "reviewedBy"})
    @Query("select submission from ContentSubmission submission where submission.id = :id")
    Optional<ContentSubmission> findByIdForUpdate(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"submittedBy", "reviewedBy"})
    Optional<ContentSubmission> findByContentTypeAndContentId(
            ContributionContentType contentType, UUID contentId);

    @EntityGraph(attributePaths = {"submittedBy", "reviewedBy"})
    @Query("""
            select submission from ContentSubmission submission
            where submission.submittedBy.id = :ownerId
              and (:type is null or submission.contentType = :type)
              and (:status is null or submission.status = :status)
            """)
    Page<ContentSubmission> findOwned(
            @Param("ownerId") UUID ownerId,
            @Param("type") ContributionContentType type,
            @Param("status") ReviewStatus status,
            Pageable pageable
    );

}
