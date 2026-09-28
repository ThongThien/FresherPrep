package com.fesherprep.fesherprep_api.pet.repository;

import com.fesherprep.fesherprep_api.pet.domain.PetSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PetSettingsRepository extends JpaRepository<PetSettings, Short> {
}
