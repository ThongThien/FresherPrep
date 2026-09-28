package com.fesherprep.fesherprep_api.lesson.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LessonContentSanitizerTests {
    private final LessonContentSanitizer sanitizer = new LessonContentSanitizer();

    @Test
    void keepsSupportedRichContent() {
        String sanitized = sanitizer.sanitize(
                "<h2>Java</h2><p><strong>Safe</strong> text</p>"
                        + "<pre><code>int value = 1;</code></pre>"
                        + "<table><tbody><tr><th>Type</th><td>JVM</td></tr></tbody></table>"
                        + "<img src=\"https://example.supabase.co/image.png\" alt=\"Diagram\">"
        );

        assertThat(sanitized)
                .contains("<h2>Java</h2>")
                .contains("<pre><code>int value = 1;</code></pre>")
                .contains("<table>")
                .contains("https://example.supabase.co/image.png");
    }

    @Test
    void removesScriptsHandlersStylesAndUnsafeUrls() {
        String sanitized = sanitizer.sanitize(
                "<p style=\"color:red\" onclick=\"alert(1)\">Text</p>"
                        + "<script>alert(1)</script>"
                        + "<svg onload=\"alert(1)\"><circle></circle></svg>"
                        + "<math><mtext>unsafe</mtext></math>"
                        + "<template><img src=x onerror=\"alert(1)\"></template>"
                        + "<a href=\"javascript:alert(1)\">Unsafe</a>"
                        + "<iframe src=\"https://example.com\"></iframe>"
        );

        assertThat(sanitized)
                .contains("<p>Text</p>")
                .doesNotContain(
                        "style", "onclick", "script", "javascript:", "iframe",
                        "svg", "onload", "math", "template", "onerror"
                );
    }

    @Test
    void preservesLegacyPlainTextAndJavaGenerics() {
        String legacy = "## Collections\nUse List<String> when order matters.";

        assertThat(sanitizer.sanitize(legacy)).isEqualTo(legacy);
    }

    @Test
    void rejectsContentWithNoSafeOutput() {
        assertThatThrownBy(() -> sanitizer.sanitize("<script>alert(1)</script>"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("safe content");
    }
}
