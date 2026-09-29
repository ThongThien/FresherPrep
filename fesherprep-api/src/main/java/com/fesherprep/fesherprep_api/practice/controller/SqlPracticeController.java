package com.fesherprep.fesherprep_api.practice.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.practice.dto.*;
import com.fesherprep.fesherprep_api.practice.service.SqlPracticeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/practice/sql")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class SqlPracticeController {
    private final SqlPracticeService service;

    @GetMapping
    public List<PracticeExerciseSummaryResponse> exercises() {
        return service.exercises();
    }

    @GetMapping("/{exerciseId}")
    public PracticeExerciseDetailResponse exercise(@PathVariable UUID exerciseId) {
        return service.exercise(exerciseId);
    }

    @PostMapping("/{exerciseId}/submit")
    public SqlSubmitResponse submit(
            @PathVariable UUID exerciseId,
            @Valid @RequestBody SqlSubmitRequest request
    ) {
        return service.submit(exerciseId, request);
    }
}

