package com.fesherprep.fesherprep_api.comment.repository;

import com.fesherprep.fesherprep_api.comment.domain.AdminNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AdminNotificationRepository extends JpaRepository<AdminNotification, UUID> {
    @EntityGraph(attributePaths = {"comment", "comment.author", "comment.lesson", "comment.quiz"})
    Page<AdminNotification> findAllByRecipientId(UUID recipientId, Pageable pageable);

    @EntityGraph(attributePaths = {"comment", "comment.author", "comment.lesson", "comment.quiz"})
    Optional<AdminNotification> findByIdAndRecipientId(UUID id, UUID recipientId);

    long countByRecipientIdAndReadAtIsNull(UUID recipientId);
}
