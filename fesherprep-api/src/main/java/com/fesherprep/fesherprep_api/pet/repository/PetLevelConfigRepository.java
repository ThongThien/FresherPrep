package com.fesherprep.fesherprep_api.pet.repository;

import com.fesherprep.fesherprep_api.pet.domain.PetLevelConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetLevelConfigRepository extends JpaRepository<PetLevelConfig, Integer> {
    List<PetLevelConfig> findAllByOrderByLevelAsc();
}
