package com.fesherprep.fesherprep_api.practice.repository;

import com.fesherprep.fesherprep_api.practice.domain.PracticeSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PracticeSubmissionRepository extends JpaRepository<PracticeSubmission, UUID> {
}

