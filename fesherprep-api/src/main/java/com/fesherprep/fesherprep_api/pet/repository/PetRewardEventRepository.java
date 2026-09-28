package com.fesherprep.fesherprep_api.pet.repository;

import com.fesherprep.fesherprep_api.pet.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PetRewardEventRepository extends JpaRepository<PetRewardEvent, UUID> {
    boolean existsByUserIdAndActivityTypeAndSourceId(
            UUID userId,
            PetActivityType activityType,
            UUID sourceId
    );
}
