package com.fesherprep.fesherprep_api.user.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRequest;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRoleRequest;
import com.fesherprep.fesherprep_api.user.dto.UserResponse;
import com.fesherprep.fesherprep_api.user.dto.AchievementProgressResponse;
import com.fesherprep.fesherprep_api.user.service.UserService;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        return userService.getCurrentUser();
    }

    @GetMapping("/me/achievement-progress")
    public AchievementProgressResponse getMyAchievementProgress() {
        return userService.getMyAchievementProgress();
    }

    @PatchMapping("/me")
    public UserResponse updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        return userService.updateCurrentUser(request);
    }

    @PatchMapping("/{userId}/role")
    public UserResponse updateRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return userService.updateRole(userId, request);
    }
}
