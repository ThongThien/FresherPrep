package com.fesherprep.fesherprep_api.pet.service;

import com.fesherprep.fesherprep_api.pet.domain.PetLevelConfig;
import com.fesherprep.fesherprep_api.pet.domain.PetSettings;
import com.fesherprep.fesherprep_api.pet.domain.Pet;
import com.fesherprep.fesherprep_api.pet.domain.UserPet;
import com.fesherprep.fesherprep_api.pet.domain.UserPetStatus;
import com.fesherprep.fesherprep_api.pet.repository.*;
import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetServiceTests {
    @Mock
    private PetSettingsRepository settingsRepository;
    @Mock
    private PetLevelConfigRepository levelRepository;
    @Mock
    private PetRepository petRepository;
    @Mock
    private UserPetRepository userPetRepository;
    @Mock
    private PetRewardEventRepository rewardRepository;
    @Mock
    private UserRepository userRepository;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getMyPetResolvesTheJwtSubjectAsUserId() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        UserPet pet = mock(UserPet.class);
        PetSettings settings = mock(PetSettings.class);
        PetLevelConfig level = mock(PetLevelConfig.class);
        Pet definition = mock(Pet.class);
        when(user.isActive()).thenReturn(true);
        when(user.getId()).thenReturn(userId);
        when(pet.getPetLevel()).thenReturn(1);
        when(pet.getPet()).thenReturn(definition);
        when(pet.getStatus()).thenReturn(UserPetStatus.ACTIVE);
        when(settings.getPointsPerFood()).thenReturn(10);
        when(settings.getEnergyPerFood()).thenReturn(20);
        when(level.getLevelOrder()).thenReturn(1);
        when(level.getRequiredEnergy()).thenReturn(100);
        when(definition.getLevels()).thenReturn(List.of(level));
        when(userRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
        when(userPetRepository.findActiveByUserIdForUpdate(userId)).thenReturn(Optional.of(pet));
        when(settingsRepository.findById(PetSettings.SINGLETON_ID)).thenReturn(Optional.of(settings));
        authenticate(userId);

        service().getMyPet();

        verify(userRepository).findByIdForUpdate(userId);
        verify(userRepository, never()).findByEmail(anyString());
    }

    private PetService service() {
        return new PetService(
                settingsRepository,
                petRepository,
                levelRepository,
                userPetRepository,
                rewardRepository,
                userRepository
        );
    }

    private static void authenticate(UUID userId) {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(userId.toString(), null, List.of())
        );
    }
}
