package com.fesherprep.fesherprep_api.pet.service;

import com.fesherprep.fesherprep_api.config.SupabaseStorageProperties;
import com.fesherprep.fesherprep_api.pet.dto.PetAssetUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PetAssetStorageService {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/webp", "webp",
            "image/png", "png",
            "image/jpeg", "jpg"
    );
    private final SupabaseStorageProperties properties;

    @PreAuthorize("hasRole('ADMIN')")
    public PetAssetUploadResponse upload(String petCode, int level, MultipartFile file) {
        requireConfigured();
        String normalizedCode = normalizeCode(petCode);
        if (level < 1) throw new IllegalArgumentException("Pet level must be positive");
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Pet image is required");
        if (file.getSize() > properties.maxFileSize()) {
            throw new IllegalArgumentException("Pet image exceeds the configured size limit");
        }
        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new IllegalArgumentException("Pet image must be WEBP, PNG, or JPEG");
        }

        String objectPath = "pets/" + normalizedCode.toLowerCase(Locale.ROOT)
                + "/levels/" + level + "/" + UUID.randomUUID() + "." + extension;
        URI uploadUri = URI.create(baseUrl() + "/storage/v1/object/" + properties.bucket() + "/" + objectPath);
        try {
            HttpRequest request = HttpRequest.newBuilder(uploadUri)
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + properties.secretKey())
                    .header("apikey", properties.secretKey())
                    .header("Content-Type", contentType)
                    .header("x-upsert", "false")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                    .build();
            HttpResponse<Void> response = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build()
                    .send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Supabase Storage rejected the Pet image upload");
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read or upload the Pet image", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Pet image upload was interrupted", exception);
        }

        String publicUrl = baseUrl() + "/storage/v1/object/public/"
                + properties.bucket() + "/" + objectPath;
        return new PetAssetUploadResponse(publicUrl, contentType, file.getSize());
    }

    private void requireConfigured() {
        if (!properties.configured()) {
            throw new IllegalStateException("Supabase Pet Storage has not been configured");
        }
        URI uri = URI.create(baseUrl());
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalStateException("Supabase Storage URL must use HTTPS");
        }
        if (!properties.bucket().matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalStateException("Supabase Storage bucket name is invalid");
        }
        if (properties.maxFileSize() < 1) {
            throw new IllegalStateException("Pet image size limit is invalid");
        }
    }

    private String baseUrl() {
        return properties.url() == null ? "" : properties.url().replaceAll("/+$", "");
    }

    private static String normalizeCode(String value) {
        if (value == null || !value.strip().matches("[A-Za-z0-9_-]{1,60}")) {
            throw new IllegalArgumentException("Pet code is invalid");
        }
        return value.strip();
    }
}
