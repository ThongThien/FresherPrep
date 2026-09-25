"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

type ContentBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "callout"; text: string }
  | { type: "code"; language: string | null; code: string };

export function LessonContent({ content }: { content: string }) {
  const { t } = useI18n();
  const blocks = parseContent(content);
  return <article className="lesson-prose">{blocks.length ? blocks.map((block, index) => <ContentBlockView block={block} key={index} />) : <p>{t("Lesson content is not available yet.")}</p>}</article>;
}

function ContentBlockView({ block }: { block: ContentBlock }) {
  const { t } = useI18n();
  if (block.type === "heading") {
    const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
    return <Tag>{inlineContent(block.text)}</Tag>;
  }
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return <List>{block.items.map((item, index) => <li key={index}>{inlineContent(item)}</li>)}</List>;
  }
  if (block.type === "callout") return <aside className="lesson-callout" aria-label={t("Note")}>{inlineContent(block.text)}</aside>;
  if (block.type === "code") return <CodeBlock code={block.code} language={block.language} />;
  return <p>{inlineContent(block.text)}</p>;
}

function CodeBlock({ code, language }: { code: string; language: string | null }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="overflow-hidden rounded-md border border-slate-700 bg-slate-950 text-slate-100">
      <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-700 px-4">
        <span className="font-mono text-xs text-slate-300">{language || t("code")}</span>
        <button type="button" className="min-h-8 rounded-sm px-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60" onClick={() => void copyCode()}>{copied ? t("Copied") : t("Copy")}</button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6"><code>{code}</code></pre>
    </div>
  );
}

function inlineContent(text: string): ReactNode[] {
  const marker = String.fromCharCode(96);
  const pattern = new RegExp("(" + marker + "[^" + marker + "]+" + marker + ")", "g");
  return text.split(pattern).filter(Boolean).map((part, index) => part.startsWith(marker) && part.endsWith(marker)
    ? <code key={index}>{part.slice(1, -1)}</code> : part);
}

function parseContent(content: string): ContentBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ContentBlock[] = [];
  const fence = String.fromCharCode(96).repeat(3);
  for (let index = 0; index < lines.length;) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.startsWith(fence)) {
      const language = line.slice(fence.length).trim() || null;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence)) { code.push(lines[index]); index += 1; }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language, code: code.join("\n") });
      continue;
    }
    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) { blocks.push({ type: "heading", level: heading[1].length as 2 | 3 | 4, text: heading[2] }); index += 1; continue; }
    if (line.startsWith(">")) { blocks.push({ type: "callout", text: line.slice(1).trim() }); index += 1; continue; }
    const listMatch = /^([-*]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      const ordered = /\d+\./.test(listMatch[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = /^([-*]|\d+\.)\s+(.+)$/.exec(lines[index].trim());
        if (!item || /\d+\./.test(item[1]) !== ordered) break;
        items.push(item[2]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || next.startsWith(fence) || /^(#{2,4})\s+/.test(next) || next.startsWith(">") || /^([-*]|\d+\.)\s+/.test(next)) break;
      paragraph.push(next);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}
