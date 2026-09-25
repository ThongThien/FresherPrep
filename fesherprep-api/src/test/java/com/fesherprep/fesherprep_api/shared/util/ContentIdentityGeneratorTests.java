package com.fesherprep.fesherprep_api.shared.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class ContentIdentityGeneratorTests {
    private final ContentIdentityGenerator generator = new ContentIdentityGenerator();

    @Test
    void generatesReadableSlugAndCodeWithFiveCharacterSuffix() {
        assertTrue(generator.slug("Java OOP", 180).matches("java-oop-[a-z0-9]{5}"));
        assertTrue(generator.code("java basics", 50).matches("JAVA-BASICS-[A-Z0-9]{5}"));
    }
}
