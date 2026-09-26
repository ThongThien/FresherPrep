"use client";

import { Badge } from "@/components/ui";
import type { ContributionContentType } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

export function ContributionContentSummary({ type, content }: { type: ContributionContentType; content: unknown }) {
  const { t } = useI18n();
  const value = objectOf(content);

  if (type === "LESSON") {
    const lesson = objectOf(value.lesson ?? value);
    return <div className="mt-4 space-y-4"><div><h4 className="text-lg font-semibold text-text">{textOf(lesson.title)}</h4><p className="mt-2 text-sm text-text-muted">{t("Reading requirement: {{seconds}} seconds and {{percent}}% scroll.", { seconds: numberOf(lesson.minimumReadSeconds), percent: numberOf(lesson.requiredScrollPercent) })}</p></div><dl className="grid gap-3 text-sm sm:grid-cols-2"><Meta label={t("Display order")} value={textOf(lesson.displayOrder)} /><Meta label={t("Status")} value={t(textOf(lesson.status))} /></dl><div className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-md bg-surface-muted p-4 text-sm leading-7 text-text">{textOf(lesson.content)}</div></div>;
  }

  if (type === "QUESTION") {
    const question = objectOf(value.question);
    const versions = arrayOf(value.versions).map(objectOf);
    return <div className="mt-4 space-y-5"><div className="flex flex-wrap gap-2"><Badge>{textOf(question.code)}</Badge><Badge variant="info">{t(textOf(question.difficulty))}</Badge><Badge>{t(textOf(question.language))}</Badge><Badge>{t(textOf(question.category))}</Badge></div>{versions.length ? versions.map((version) => <article key={textOf(version.id)} className="rounded-md border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold text-text">{t("Version {{number}}", { number: numberOf(version.versionNumber) })}</h4>{textOf(question.publishedVersionId) === textOf(version.id) ? <Badge variant="success">{t("Published")}</Badge> : null}</div><p className="mt-3 text-sm font-medium text-text">{textOf(version.content)}</p><p className="mt-2 text-sm text-text-muted">{textOf(version.explanation)}</p><ol className="mt-4 space-y-2">{arrayOf(version.options).map(objectOf).map((option) => <li key={textOf(option.id) || textOf(option.position)} className="rounded-md bg-surface-muted px-3 py-2 text-sm"><span className="font-semibold text-text">{textOf(option.position)}. {textOf(option.content)}</span>{Boolean(option.correct) ? <Badge className="ml-2" variant="success">{t("Correct")}</Badge> : null}<p className="mt-1 text-xs text-text-muted">{textOf(option.explanation)}</p></li>)}</ol></article>) : <p className="text-sm text-text-muted">{t("No versions yet.")}</p>}</div>;
  }

  const fixedQuestions = arrayOf(value.fixedQuestions).map(objectOf);
  const rules = arrayOf(value.rules).map(objectOf);
  return <div className="mt-4 space-y-5"><dl className="grid gap-3 text-sm sm:grid-cols-2"><Meta label={t("Title")} value={textOf(value.title)} /><Meta label={t("Code")} value={textOf(value.code)} /><Meta label={t("Type")} value={t(textOf(value.type))} /><Meta label={t("Selection mode")} value={t(textOf(value.selectionMode))} /><Meta label={t("Pass percentage")} value={`${numberOf(value.passPercentage)}%`} /><Meta label={t("Status")} value={t(textOf(value.status))} /></dl>{fixedQuestions.length ? <div><h4 className="text-sm font-semibold text-text">{t("Fixed questions")}</h4><ol className="mt-2 space-y-2">{fixedQuestions.map((item) => <li key={textOf(item.id)} className="rounded-md bg-surface-muted px-3 py-2 text-sm text-text">{numberOf(item.position)}. {textOf(item.questionCode)}</li>)}</ol></div> : null}{rules.length ? <div><h4 className="text-sm font-semibold text-text">{t("Selection rules")}</h4><ul className="mt-2 space-y-2">{rules.map((rule) => <li key={textOf(rule.id)} className="rounded-md bg-surface-muted px-3 py-2 text-sm text-text">{t("{{count}} questions", { count: numberOf(rule.questionCount) })} · {textOf(rule.difficulty) || t("Any difficulty")}</li>)}</ul></div> : null}</div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-1 font-medium text-text">{value || "-"}</dd></div>;
}
function objectOf(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function arrayOf(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function textOf(value: unknown): string { return value === null || value === undefined ? "" : String(value); }
function numberOf(value: unknown): number { const number = Number(value); return Number.isFinite(number) ? number : 0; }
