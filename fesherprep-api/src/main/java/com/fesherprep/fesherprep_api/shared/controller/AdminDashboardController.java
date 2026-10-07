package com.fesherprep.fesherprep_api.shared.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.shared.dto.AdminDashboardResponse;
import com.fesherprep.fesherprep_api.shared.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminDashboardController {
    private final AdminDashboardService dashboardService;

    @GetMapping
    public AdminDashboardResponse getContentSummary() {
        return dashboardService.getContentSummary();
    }
}
