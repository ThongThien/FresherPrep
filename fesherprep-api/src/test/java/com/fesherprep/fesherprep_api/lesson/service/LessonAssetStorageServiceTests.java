package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.config.SupabaseStorageProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LessonAssetStorageServiceTests {
    private final LessonAssetStorageService service = new LessonAssetStorageService(
            new SupabaseStorageProperties(
                    "https://example.supabase.co",
                    "test-secret",
                    "pet-assets",
                    20
            )
    );

    @Test
    void rejectsUnsupportedOrSpoofedImagesBeforeUpload() {
        MockMultipartFile svg = new MockMultipartFile(
                "file", "lesson.svg", "image/svg+xml", "<svg/>".getBytes());
        MockMultipartFile spoofedPng = new MockMultipartFile(
                "file", "lesson.png", "image/png", "not-png".getBytes());

        assertThatThrownBy(() -> service.upload(svg))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("WEBP, PNG, or JPEG");
        assertThatThrownBy(() -> service.upload(spoofedPng))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("does not match");
    }

    @Test
    void rejectsFileLargerThanConfiguredLimit() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "lesson.png", "image/png", new byte[21]);

        assertThatThrownBy(() -> service.upload(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("size limit");
    }
}
