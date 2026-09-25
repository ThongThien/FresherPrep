package com.fesherprep.fesherprep_api.user.dto;

import jakarta.validation.constraints.NotNull;

public record ChangeUserStatusRequest(@NotNull Boolean active) {
}
