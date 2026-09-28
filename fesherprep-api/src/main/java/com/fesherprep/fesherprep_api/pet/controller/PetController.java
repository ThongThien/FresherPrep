package com.fesherprep.fesherprep_api.pet.controller;

import com.fesherprep.fesherprep_api.config.OpenApiConfiguration;
import com.fesherprep.fesherprep_api.pet.dto.PetStateResponse;
import com.fesherprep.fesherprep_api.pet.dto.PetCollectionResponse;
import com.fesherprep.fesherprep_api.pet.service.PetService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pet")
@RequiredArgsConstructor
@SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
public class PetController {
    private final PetService petService;

    @GetMapping
    public PetStateResponse getMyPet() {
        return petService.getMyPet();
    }

    @PostMapping("/feed")
    public PetStateResponse feedMyPet() {
        return petService.feedMyPet(false);
    }

    @PostMapping("/feed-all")
    public PetStateResponse feedAll() {
        return petService.feedMyPet(true);
    }

    @PostMapping("/upgrade")
    public PetStateResponse upgradeMyPet() {
        return petService.upgradeMyPet();
    }

    @GetMapping("/collection")
    public PetCollectionResponse collection() {
        return petService.getMyCollection();
    }

    @PostMapping("/select/{petId}")
    public PetStateResponse select(@PathVariable java.util.UUID petId) {
        return petService.selectPet(petId);
    }
}
