package com.fesherprep.fesherprep_api.practice.dto;

import java.util.List;

public record SqlResultTableResponse(
        List<String> columns,
        List<List<String>> rows
) {
}

