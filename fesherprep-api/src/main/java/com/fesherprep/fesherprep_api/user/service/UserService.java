package com.fesherprep.fesherprep_api.user.service;

import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRequest;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRoleRequest;
import com.fesherprep.fesherprep_api.user.dto.UserResponse;
import com.fesherprep.fesherprep_api.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Service
@Validated
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        return UserResponse.from(requireCurrentUser());
    }

    @Transactional
    public UserResponse updateCurrentUser(@Valid UpdateUserRequest request) {
        User user = requireCurrentUser();
        user.changeDisplayName(request.displayName());
        return UserResponse.from(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse updateRole(UUID userId, @Valid UpdateUserRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User does not exist"));
        user.changeRole(request.role());
        return UserResponse.from(user);
    }

    private User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication is required");
        }

        UUID userId;
        try {
            userId = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new AuthenticationCredentialsNotFoundException("Invalid authenticated principal");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Authenticated user no longer exists"));
    }
}
