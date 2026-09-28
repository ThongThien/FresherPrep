import DOMPurify from "dompurify";

const recognizedHtml = /<\/?(?:p|br|h[1-4]|strong|b|em|i|u|s|ul|ol|li|blockquote|code|pre|hr|a|img|table|thead|tbody|tfoot|tr|th|td|script|style|iframe)\b/i;

const allowedTags = [
  "p", "br", "h1", "h2", "h3", "h4",
  "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "blockquote", "code", "pre", "hr",
  "a", "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];

export function prepareLessonHtml(content: string) {
  const html = recognizedHtml.test(content) ? content : legacyLessonContentToHtml(content);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["href", "title", "src", "alt", "colspan", "rowspan", "rel"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style"],
  });
}

export function hasMeaningfulLessonContent(content: string) {
  const sanitized = prepareLessonHtml(content);
  if (/<img\b/i.test(sanitized)) return true;
  const text = sanitized
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, "x")
    .trim();
  return Boolean(text);
}

function legacyLessonContentToHtml(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  const fence = String.fromCharCode(96).repeat(3);

  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith(fence)) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const level = Math.max(1, Math.min(4, heading[1].length));
      blocks.push(`<h${level}>${legacyInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }
    if (line.startsWith(">")) {
      blocks.push(`<blockquote><p>${legacyInline(line.slice(1).trim())}</p></blockquote>`);
      index += 1;
      continue;
    }
    const listMatch = /^([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^([-*]|\d+\.)\s+(.+)$/.exec(lines[index].trim());
        if (!item || /\d+\./.test(item[1]) !== ordered) break;
        items.push(`<li>${legacyInline(item[2])}</li>`);
        index += 1;
      }
      const tag = ordered ? "ol" : "ul";
      blocks.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }
    const paragraph = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith(fence) || /^(#{1,4})\s+/.test(next)
        || next.startsWith(">") || /^([-*]|\d+\.)\s+/.test(next)) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push(`<p>${legacyInline(paragraph.join(" "))}</p>`);
  }

  return blocks.join("");
}

function legacyInline(value: string) {
  const marker = String.fromCharCode(96);
  return escapeHtml(value).replace(
    new RegExp(marker + "([^" + marker + "]+)" + marker, "g"),
    "<code>$1</code>",
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
