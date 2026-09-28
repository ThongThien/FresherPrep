package com.fesherprep.fesherprep_api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase.storage")
public record SupabaseStorageProperties(
        String url,
        String secretKey,
        String bucket,
        long maxFileSize
) {
    public boolean configured() {
        return url != null && !url.isBlank()
                && secretKey != null && !secretKey.isBlank()
                && bucket != null && !bucket.isBlank();
    }
}
