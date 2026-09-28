package com.fesherprep.fesherprep_api.pet.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.pet.dto.*;
import com.fesherprep.fesherprep_api.pet.service.PetService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/pet-config")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminPetController {
    private final PetService petService;

    @GetMapping
    public PetConfigResponse getConfiguration() {
        return petService.getConfiguration();
    }

    @PutMapping
    public PetConfigResponse updateConfiguration(@Valid @RequestBody UpdatePetConfigRequest request) {
        return petService.updateConfiguration(request);
    }
}
