"use client";

import { useMemo } from "react";

import { useI18n } from "@/lib/i18n";
import { prepareLessonHtml } from "@/lib/lessons/content";

export function LessonContent({ content }: { content: string }) {
  const { t } = useI18n();
  const html = useMemo(() => prepareLessonHtml(content), [content]);

  if (!html.trim()) {
    return <article className="lesson-prose"><p>{t("Lesson content is not available yet.")}</p></article>;
  }

  return (
    <article
      className="lesson-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
