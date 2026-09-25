"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Feedback, Label, Select } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { PageResponse } from "@/lib/dashboard/types";
import type { PublishedQuiz } from "@/lib/quizzes/types";
import { useI18n } from "@/lib/i18n";

export function QuizListPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<PublishedQuiz>>();
  const [error, setError] = useState<string>();
  const [language, setLanguage] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (language) params.set("language", language);
    if (category) params.set("category", category);
    void fetch("/api/quizzes?" + params.toString(), { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=%2Fquizzes");
        if (!response.ok) return setError((await readApiError(response)).message);
        setData(await response.json() as PageResponse<PublishedQuiz>);
        setError(undefined);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(t("Unable to load available quizzes."));
      });
    return () => controller.abort();
  }, [page, reload, t, language, category]);

  if (error && !data) return <div className="mx-auto max-w-3xl py-10"><Feedback tone="error" title={t("Quizzes unavailable")}>{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setReload((value) => value + 1); }}>{t("Try again")}</Button></div>;
  if (!data) return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">{t("Loading quizzes")}</span><div className="h-9 w-60 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="h-40 rounded-lg bg-surface" /><div className="h-40 rounded-lg bg-surface" /></div></div>;

  return <div className="mx-auto w-full max-w-6xl">
    <header className="max-w-3xl"><p className="text-sm font-semibold text-primary">{t("Assessments")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{t("Quizzes")}</h1><p className="mt-3 text-sm leading-6 text-text-muted">{t("Choose a published technical assessment. Questions are created by the backend when you start an attempt.")}</p></header>
    <div className="mt-7 grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
      <div><Label htmlFor="quiz-language-filter">{t("Language")}</Label><Select id="quiz-language-filter" value={language} onChange={(event) => { setPage(0); setData(undefined); setLanguage(event.target.value); }}><option value="">{t("All languages")}</option><option value="VI">{t("Vietnamese")}</option><option value="EN">{t("English")}</option></Select></div>
      <div><Label htmlFor="quiz-category-filter">{t("Category")}</Label><Select id="quiz-category-filter" value={category} onChange={(event) => { setPage(0); setData(undefined); setCategory(event.target.value); }}><option value="">{t("All categories")}</option>{["TECHNICAL", "GRAMMAR", "VOCABULARY", "TOEIC", "MIXED"].map((value) => <option key={value} value={value}>{t(value)}</option>)}</Select></div>
    </div>
    {error ? <Feedback className="mt-6" tone="warning" title={t("Unable to refresh")}>{error}</Feedback> : null}
    {!data.content.length ? <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center"><h2 className="font-semibold text-text">{t("No published quizzes")}</h2><p className="mt-2 text-sm text-text-muted">{t("Available assessments will appear here.")}</p><Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary" href="/learning-paths">{t("Continue learning")}</Link></div> : <ul className="mt-8 grid gap-4 md:grid-cols-2">{data.content.map((quiz) => <li className="rounded-lg border border-border bg-surface p-5 shadow-card" key={quiz.id}><div className="flex flex-wrap gap-2"><Badge variant="info">{t(quiz.language === "EN" ? "English" : "Vietnamese")}</Badge><Badge>{t(quiz.category)}</Badge><Badge>{t(quiz.selectionMode === "FIXED" ? "Fixed" : "Rule-based")}</Badge></div><h2 className="mt-4 text-lg font-semibold text-text">{quiz.title}</h2><div className="mt-2 space-y-1 text-sm text-text-muted"><p>{t("{{count}} questions", { count: quiz.questionCount })}</p><p>{t("Pass requirement:")} {quiz.passingScore} / {quiz.maximumScore} ({quiz.passPercentage}%)</p></div><Link className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 text-sm font-semibold text-white hover:bg-primary-solid-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25" href={"/quizzes/" + quiz.id}>{t("View quiz")}</Link></li>)}</ul>}
    {data.totalPages > 1 ? <nav className="mt-6 flex items-center justify-between gap-4" aria-label={t("Quiz pages")}><Button variant="secondary" disabled={data.first} onClick={() => { setData(undefined); setPage((value) => value - 1); }}>{t("Previous")}</Button><span className="text-sm tabular-nums text-text-muted">{t("Page {{page}} of {{total}}", { page: data.number + 1, total: data.totalPages })}</span><Button variant="secondary" disabled={data.last} onClick={() => { setData(undefined); setPage((value) => value + 1); }}>{t("Next")}</Button></nav> : null}
  </div>;
}
