package com.fesherprep.fesherprep_api.pet.repository;

import com.fesherprep.fesherprep_api.pet.domain.UserPet;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserPetRepository extends JpaRepository<UserPet, UUID> {
    @Override
    @EntityGraph(attributePaths = "user")
    Page<UserPet> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Page<UserPet> findAllByUserEmailContainingIgnoreCaseOrUserDisplayNameContainingIgnoreCase(
            String email,
            String displayName,
            Pageable pageable
    );

    Optional<UserPet> findByUserId(UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select pet from UserPet pet where pet.user.id = :userId")
    Optional<UserPet> findByUserIdForUpdate(@Param("userId") UUID userId);

    @Query("select coalesce(max(pet.petLevel), 1) from UserPet pet")
    int findHighestCurrentLevel();
}
