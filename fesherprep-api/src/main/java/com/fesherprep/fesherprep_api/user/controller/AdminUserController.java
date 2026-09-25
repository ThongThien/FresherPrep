package com.fesherprep.fesherprep_api.user.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.user.domain.UserRole;
import com.fesherprep.fesherprep_api.user.dto.AdminUserDetailResponse;
import com.fesherprep.fesherprep_api.user.dto.AdminUserSummaryResponse;
import com.fesherprep.fesherprep_api.user.dto.ChangeUserStatusRequest;
import com.fesherprep.fesherprep_api.user.dto.UpdateUserRoleRequest;
import com.fesherprep.fesherprep_api.user.service.UserService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminUserController {
    private final UserService userService;

    @GetMapping
    public Page<AdminUserSummaryResponse> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(
                    size = 20,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return userService.getAdminUsers(search, role, active, pageable);
    }

    @GetMapping("/{userId}")
    public AdminUserDetailResponse getUser(@PathVariable UUID userId) {
        return userService.getAdminUser(userId);
    }

    @PatchMapping("/{userId}/status")
    public AdminUserSummaryResponse changeStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody ChangeUserStatusRequest request
    ) {
        return userService.changeAdminStatus(userId, request);
    }

    @PatchMapping("/{userId}/role")
    public AdminUserSummaryResponse changeRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return userService.changeAdminRole(userId, request);
    }
}
