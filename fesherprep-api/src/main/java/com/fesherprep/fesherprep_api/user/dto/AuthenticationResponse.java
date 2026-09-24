package com.fesherprep.fesherprep_api.user.dto;

public record AuthenticationResponse(UserResponse user, TokenPairResponse tokens) {
}
