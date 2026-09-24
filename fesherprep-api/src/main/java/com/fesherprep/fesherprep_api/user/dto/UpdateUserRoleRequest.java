package com.fesherprep.fesherprep_api.user.dto;

import com.fesherprep.fesherprep_api.user.domain.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull UserRole role) {
}
