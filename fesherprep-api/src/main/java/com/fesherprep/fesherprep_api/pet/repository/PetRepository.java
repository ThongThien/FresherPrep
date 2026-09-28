package com.fesherprep.fesherprep_api.pet.repository;

import com.fesherprep.fesherprep_api.pet.domain.Pet;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface PetRepository extends JpaRepository<Pet, UUID> {
    @EntityGraph(attributePaths = "levels")
    List<Pet> findAllByOrderByDisplayOrderAsc();
    @EntityGraph(attributePaths = "levels")
    List<Pet> findAllByActiveTrueOrderByDisplayOrderAsc();
    @Query("select distinct pet from Pet pet left join fetch pet.levels where pet.id = :id")
    Optional<Pet> findWithLevelsById(@Param("id") UUID id);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    boolean existsByCodeIgnoreCase(String code);
}
