package com.fesherprep.fesherprep_api.shared.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

import java.util.List;
import java.util.Map;

public record AdminDashboardResponse(
        List<Metric> metrics,
        Map<ContentStatus, Long> statusTotals,
        List<String> unavailable
) {
    public record Metric(String key, String label, long total) {
    }
}
