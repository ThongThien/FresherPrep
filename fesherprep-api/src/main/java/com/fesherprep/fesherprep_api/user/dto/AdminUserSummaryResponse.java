package com.fesherprep.fesherprep_api.user.dto;

import com.fesherprep.fesherprep_api.user.domain.User;
import com.fesherprep.fesherprep_api.user.domain.UserRole;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummaryResponse(
        UUID id,
        String email,
        String displayName,
        UserRole role,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static AdminUserSummaryResponse from(User user) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
