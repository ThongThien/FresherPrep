package com.fesherprep.fesherprep_api.shared.util;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.text.Normalizer;
import java.util.Locale;

@Component
public class ContentIdentityGenerator {
    private static final char[] SUFFIX = "abcdefghijklmnopqrstuvwxyz0123456789".toCharArray();
    private final SecureRandom random = new SecureRandom();

    public String slug(String value, int maximumLength) {
        return base(value, maximumLength - 6).toLowerCase(Locale.ROOT) + "-" + suffix();
    }

    public String code(String value, int maximumLength) {
        return (base(value, maximumLength - 6) + "-" + suffix()).toUpperCase(Locale.ROOT);
    }

    private String base(String value, int maximumLength) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) normalized = "content";
        if (normalized.length() > maximumLength) {
            normalized = normalized.substring(0, maximumLength).replaceAll("-+$", "");
        }
        return normalized.isBlank() ? "content" : normalized;
    }

    private String suffix() {
        StringBuilder value = new StringBuilder(5);
        for (int index = 0; index < 5; index++) value.append(SUFFIX[random.nextInt(SUFFIX.length)]);
        return value.toString();
    }
}
