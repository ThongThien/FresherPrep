package com.fesherprep.fesherprep_api.pet.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.pet.dto.*;
import com.fesherprep.fesherprep_api.pet.service.PetAssetStorageService;
import com.fesherprep.fesherprep_api.pet.service.PetService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/pet-config")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class AdminPetController {
    private final PetService petService;
    private final PetAssetStorageService petAssetStorageService;

    @GetMapping
    public PetConfigResponse getConfiguration() {
        return petService.getConfiguration();
    }

    @PutMapping
    public PetConfigResponse updateConfiguration(@Valid @RequestBody UpdatePetConfigRequest request) {
        return petService.updateConfiguration(request);
    }

    @GetMapping("/pets")
    public java.util.List<PetDefinitionResponse> pets() {
        return petService.getPetDefinitions();
    }

    @PostMapping("/pets")
    public PetDefinitionResponse createPet(@Valid @RequestBody UpsertPetRequest request) {
        return petService.createPet(request);
    }

    @PutMapping("/pets/{petId}")
    public PetDefinitionResponse updatePet(
            @PathVariable java.util.UUID petId,
            @Valid @RequestBody UpsertPetRequest request
    ) {
        return petService.updatePet(petId, request);
    }

    @PostMapping(value = "/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PetAssetUploadResponse uploadAsset(
            @RequestParam String petCode,
            @RequestParam int level,
            @RequestPart("file") MultipartFile file
    ) {
        return petAssetStorageService.upload(petCode, level, file);
    }

    @GetMapping("/users")
    public Page<AdminUserPetResponse> getUserPets(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return petService.getAdminUserPets(search, pageable);
    }
}
