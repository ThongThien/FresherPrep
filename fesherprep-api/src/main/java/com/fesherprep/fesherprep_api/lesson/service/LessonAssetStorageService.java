package com.fesherprep.fesherprep_api.lesson.service;

import com.fesherprep.fesherprep_api.config.SupabaseStorageProperties;
import com.fesherprep.fesherprep_api.lesson.dto.LessonAssetUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LessonAssetStorageService {
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/webp", "webp",
            "image/png", "png",
            "image/jpeg", "jpg"
    );
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final SupabaseStorageProperties properties;

    @PreAuthorize("hasRole('ADMIN')")
    public LessonAssetUploadResponse upload(MultipartFile file) {
        requireConfigured();
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Lesson image is required");
        }
        if (file.getSize() > properties.maxFileSize()) {
            throw new IllegalArgumentException("Lesson image exceeds the configured size limit");
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("")
                .toLowerCase(Locale.ROOT);
        String extension = EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new IllegalArgumentException("Lesson image must be WEBP, PNG, or JPEG");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read the lesson image", exception);
        }
        if (!matchesSignature(contentType, bytes)) {
            throw new IllegalArgumentException("Lesson image content does not match its file type");
        }

        String objectPath = "lesson-images/" + UUID.randomUUID() + "." + extension;
        URI uploadUri = URI.create(baseUrl() + "/storage/v1/object/"
                + properties.bucket() + "/" + objectPath);
        try {
            HttpRequest request = HttpRequest.newBuilder(uploadUri)
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + properties.secretKey())
                    .header("apikey", properties.secretKey())
                    .header("Content-Type", contentType)
                    .header("x-upsert", "false")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
                    .build();
            HttpResponse<Void> response = HTTP_CLIENT.send(
                    request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Supabase Storage rejected the lesson image upload");
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to upload the lesson image", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Lesson image upload was interrupted", exception);
        }

        String publicUrl = baseUrl() + "/storage/v1/object/public/"
                + properties.bucket() + "/" + objectPath;
        return new LessonAssetUploadResponse(publicUrl, contentType, file.getSize());
    }

    private void requireConfigured() {
        if (!properties.configured()) {
            throw new IllegalStateException("Supabase Storage has not been configured");
        }
        URI uri = URI.create(baseUrl());
        if (!"https".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalStateException("Supabase Storage URL must use HTTPS");
        }
        if (!properties.bucket().matches("[a-zA-Z0-9_-]+")) {
            throw new IllegalStateException("Supabase Storage bucket name is invalid");
        }
        if (properties.maxFileSize() < 1) {
            throw new IllegalStateException("Lesson image size limit is invalid");
        }
    }

    private String baseUrl() {
        return properties.url() == null ? "" : properties.url().replaceAll("/+$", "");
    }

    private static boolean matchesSignature(String contentType, byte[] bytes) {
        return switch (contentType) {
            case "image/png" -> bytes.length >= 8
                    && unsigned(bytes[0]) == 0x89 && bytes[1] == 'P'
                    && bytes[2] == 'N' && bytes[3] == 'G'
                    && unsigned(bytes[4]) == 0x0D && unsigned(bytes[5]) == 0x0A
                    && unsigned(bytes[6]) == 0x1A && unsigned(bytes[7]) == 0x0A;
            case "image/jpeg" -> bytes.length >= 3
                    && unsigned(bytes[0]) == 0xFF
                    && unsigned(bytes[1]) == 0xD8
                    && unsigned(bytes[2]) == 0xFF;
            case "image/webp" -> bytes.length >= 12
                    && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP");
            default -> false;
        };
    }

    private static boolean ascii(byte[] bytes, int offset, String value) {
        for (int index = 0; index < value.length(); index++) {
            if (bytes[offset + index] != value.charAt(index)) return false;
        }
        return true;
    }

    private static int unsigned(byte value) {
        return value & 0xFF;
    }
}
