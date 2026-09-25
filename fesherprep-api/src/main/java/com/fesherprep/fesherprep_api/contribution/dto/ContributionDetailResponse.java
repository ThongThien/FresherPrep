package com.fesherprep.fesherprep_api.contribution.dto;

import java.util.List;

public record ContributionDetailResponse(
        ContributionSummaryResponse submission,
        Object content,
        List<ReviewHistoryResponse> history
) {
}
