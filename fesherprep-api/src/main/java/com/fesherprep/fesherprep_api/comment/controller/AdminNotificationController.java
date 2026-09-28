package com.fesherprep.fesherprep_api.comment.controller;

import com.fesherprep.fesherprep_api.comment.dto.*;
import com.fesherprep.fesherprep_api.comment.service.CommentService;
import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminNotificationController {
    private final CommentService service;

    @GetMapping
    public Page<AdminNotificationResponse> getNotifications(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return service.getNotifications(pageable);
    }

    @GetMapping("/unread-count")
    public UnreadNotificationCountResponse getUnreadCount() {
        return service.getUnreadCount();
    }

    @PostMapping("/{notificationId}/read")
    public AdminNotificationResponse markRead(@PathVariable UUID notificationId) {
        return service.markNotificationRead(notificationId);
    }
}
