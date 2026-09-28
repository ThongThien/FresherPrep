package com.fesherprep.fesherprep_api.pet.service;

import com.fesherprep.fesherprep_api.config.SupabaseStorageProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PetAssetStorageServiceTests {
    private final PetAssetStorageService service = new PetAssetStorageService(
            new SupabaseStorageProperties(
                    "https://example.supabase.co",
                    "test-secret",
                    "pet-assets",
                    10
            )
    );

    @Test
    void rejectsUnsupportedContentTypeBeforeUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "pet.svg", "image/svg+xml", new byte[]{1}
        );

        assertThatThrownBy(() -> service.upload("JAVA_CAT", 1, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("WEBP, PNG, or JPEG");
    }

    @Test
    void rejectsFileLargerThanConfiguredLimit() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "pet.webp", "image/webp", new byte[11]
        );

        assertThatThrownBy(() -> service.upload("JAVA_CAT", 1, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("size limit");
    }

    @Test
    void rejectsInvalidPetCodeAndLevel() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "pet.webp", "image/webp", new byte[]{1}
        );

        assertThatThrownBy(() -> service.upload("../pet", 1, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("code");
        assertThatThrownBy(() -> service.upload("JAVA_CAT", 0, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("level");
    }
}
