package com.fesherprep.fesherprep_api.lesson.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.regex.Pattern;

@Component
public class LessonContentSanitizer {
    private static final Pattern HTML_TAG = Pattern.compile(
            "<\\/?(?:p|br|h[1-4]|strong|b|em|i|u|s|ul|ol|li|blockquote|code|pre|hr|a|img"
                    + "|table|thead|tbody|tfoot|tr|th|td|script|style|iframe|object|embed|form"
                    + "|svg|math|template|base|meta|link|audio|video|source)\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Safelist SAFELIST = new Safelist()
            .addTags(
                    "p", "br", "h1", "h2", "h3", "h4",
                    "strong", "b", "em", "i", "u", "s",
                    "ul", "ol", "li", "blockquote", "code", "pre", "hr",
                    "a", "img",
                    "table", "thead", "tbody", "tfoot", "tr", "th", "td"
            )
            .addAttributes("a", "href", "title")
            .addAttributes("img", "src", "alt", "title")
            .addAttributes("th", "colspan", "rowspan")
            .addAttributes("td", "colspan", "rowspan")
            .addProtocols("a", "href", "http", "https", "mailto")
            .addProtocols("img", "src", "https")
            .addEnforcedAttribute("a", "rel", "noopener noreferrer nofollow");

    private static final Document.OutputSettings OUTPUT_SETTINGS =
            new Document.OutputSettings().prettyPrint(false);

    public String sanitize(String content) {
        String value = Objects.requireNonNull(content, "Lesson content is required").strip();
        if (value.isBlank()) {
            throw new IllegalArgumentException("Lesson content is required");
        }
        if (!HTML_TAG.matcher(value).find()) {
            return value;
        }
        String sanitized = Jsoup.clean(value, "", SAFELIST, OUTPUT_SETTINGS).strip();
        Document document = Jsoup.parseBodyFragment(sanitized);
        if (document.body().text().isBlank() && document.selectFirst("img") == null) {
            throw new IllegalArgumentException("Lesson content has no safe content");
        }
        return sanitized;
    }
}
