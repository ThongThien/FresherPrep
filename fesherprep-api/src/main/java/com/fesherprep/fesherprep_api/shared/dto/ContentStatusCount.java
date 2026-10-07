package com.fesherprep.fesherprep_api.shared.dto;

import com.fesherprep.fesherprep_api.shared.domain.ContentStatus;

public interface ContentStatusCount {
    ContentStatus getStatus();

    long getTotal();
}
