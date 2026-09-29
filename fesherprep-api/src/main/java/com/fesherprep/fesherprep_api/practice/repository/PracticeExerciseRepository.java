package com.fesherprep.fesherprep_api.practice.repository;

import com.fesherprep.fesherprep_api.practice.domain.*;
import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface PracticeExerciseRepository extends JpaRepository<PracticeExercise, UUID> {
    List<PracticeExercise> findAllByLanguageAndStatusOrderByDisplayOrderAsc(
            PracticeLanguage language, ContentStatus status);
    Optional<PracticeExercise> findByIdAndLanguageAndStatus(
            UUID id, PracticeLanguage language, ContentStatus status);
}

