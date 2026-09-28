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
    @EntityGraph(attributePaths = {"user", "pet"})
    Page<UserPet> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"user", "pet"})
    Page<UserPet> findAllByUserEmailContainingIgnoreCaseOrUserDisplayNameContainingIgnoreCase(
            String email,
            String displayName,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"user", "pet", "pet.levels"})
    Optional<UserPet> findByUserIdAndStatus(UUID userId, com.fesherprep.fesherprep_api.pet.domain.UserPetStatus status);

    @EntityGraph(attributePaths = {"pet", "pet.levels"})
    java.util.List<UserPet> findAllByUserIdOrderByCreatedAtAsc(UUID userId);

    boolean existsByUserIdAndPetId(UUID userId, UUID petId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select progress from UserPet progress join fetch progress.pet where progress.user.id = :userId and progress.status = com.fesherprep.fesherprep_api.pet.domain.UserPetStatus.ACTIVE")
    Optional<UserPet> findActiveByUserIdForUpdate(@Param("userId") UUID userId);

    boolean existsByPetId(UUID petId);

    @Query("select coalesce(max(progress.petLevel), 0) from UserPet progress where progress.pet.id = :petId")
    int findMaximumLevelByPetId(@Param("petId") UUID petId);
}
