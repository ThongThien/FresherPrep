"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Feedback,
  Input,
  Label,
  LoadingState,
  Select,
} from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { PublishedQuiz } from "@/lib/quizzes/types";

type QuizTab = "technical" | "english";

const pageSize = 12;
const englishCategories = ["GRAMMAR", "VOCABULARY", "TOEIC", "MIXED"];

export function QuizListPage() {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<PublishedQuiz[]>();
  const [tab, setTab] = useState<QuizTab>("technical");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/quizzes/catalog", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=%2Fquizzes");
          return;
        }
        if (!response.ok) {
          setError((await readApiError(response)).message);
          return;
        }
        setCatalog((await response.json()) as PublishedQuiz[]);
        setError(undefined);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError("Unable to load available quizzes.");
        }
      });
    return () => controller.abort();
  }, [reload]);

  const technicalCategories = useMemo(() => {
    const categories = new Map<string, string>();
    catalog
      ?.filter((quiz) => quiz.category === "TECHNICAL")
      .forEach((quiz) =>
        quiz.knowledgeCategories.forEach((category) =>
          categories.set(category.id, category.name),
        ),
      );
    return [...categories.entries()].sort((left, right) =>
      left[1].localeCompare(right[1]),
    );
  }, [catalog]);

  const filteredQuizzes = useMemo(() => {
    const normalizedQuery = query.toLocaleLowerCase();
    return (catalog ?? []).filter((quiz) => {
      const matchesTab =
        tab === "technical"
          ? quiz.category === "TECHNICAL"
          : quiz.language === "EN";
      const matchesCategory =
        !categoryFilter ||
        (tab === "technical"
          ? quiz.knowledgeCategories.some(
              (category) => category.id === categoryFilter,
            )
          : quiz.category === categoryFilter);
      const matchesQuery =
        !normalizedQuery ||
        quiz.title.toLocaleLowerCase().includes(normalizedQuery) ||
        quiz.code.toLocaleLowerCase().includes(normalizedQuery);
      return matchesTab && matchesCategory && matchesQuery;
    });
  }, [catalog, categoryFilter, query, tab]);

  const totalPages = Math.ceil(filteredQuizzes.length / pageSize);
  const visibleQuizzes = filteredQuizzes.slice(
    page * pageSize,
    (page + 1) * pageSize,
  );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
    setPage(0);
  }

  function clearFilters() {
    setDraftQuery("");
    setQuery("");
    setCategoryFilter("");
    setPage(0);
  }

  if (error && !catalog) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Feedback tone="error" title={t("Quizzes unavailable")}>
          {t(error)}
        </Feedback>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => {
            setError(undefined);
            setReload((value) => value + 1);
          }}
        >
          {t("Try again")}
        </Button>
      </div>
    );
  }
  if (!catalog) {
    return (
      <LoadingState
        className="mx-auto max-w-3xl"
        title={t("Loading quizzes...")}
        description={t("Please wait a moment.")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">{t("Assessments")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {t("Quizzes")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          {t(
            "Choose a published assessment. Questions are created by the backend when you start an attempt.",
          )}
        </p>
      </header>

      <div className="mt-7 border-b border-border">
        <div className="flex gap-1" role="tablist" aria-label={t("Assessment type")}>
          {(["technical", "english"] as const).map((value) => {
            const selected = tab === value;
            return (
              <button
                key={value}
                id={`quiz-tab-${value}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="quiz-list-panel"
                onClick={() => {
                  setTab(value);
                  setCategoryFilter("");
                  setPage(0);
                }}
                className={`min-h-11 border-b-2 px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${selected ? "border-primary text-primary-strong" : "border-transparent text-text-muted hover:text-text"}`}
              >
                {t(value === "technical" ? "Technical" : "English")}
              </button>
            );
          })}
        </div>
      </div>

      <form
        className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.55fr)_auto] sm:items-end"
        onSubmit={search}
      >
        <div>
          <Label htmlFor="quiz-search">{t("Find a quiz")}</Label>
          <Input
            id="quiz-search"
            value={draftQuery}
            maxLength={200}
            placeholder={t("Search by title or code")}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="quiz-category-filter">
            {t(tab === "technical" ? "Technical category" : "English category")}
          </Label>
          <Select
            id="quiz-category-filter"
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="">
              {t(tab === "technical" ? "All technical categories" : "All English assessments")}
            </option>
            {tab === "technical"
              ? technicalCategories.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))
              : englishCategories.map((value) => (
                  <option key={value} value={value}>{t(value)}</option>
                ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit">{t("Search")}</Button>
          {query || categoryFilter ? (
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t("Clear")}
            </Button>
          ) : null}
        </div>
      </form>

      {error ? (
        <Feedback className="mt-6" tone="warning" title={t("Unable to refresh")}>
          {t(error)}
        </Feedback>
      ) : null}

      <div id="quiz-list-panel" role="tabpanel" aria-labelledby={`quiz-tab-${tab}`}>
        {!visibleQuizzes.length ? (
          <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
            <h2 className="font-semibold text-text">
              {t(query || categoryFilter ? "No quizzes match your filters" : tab === "technical" ? "No technical assessments" : "No English assessments")}
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              {t("Available assessments will appear here.")}
            </p>
            {query || categoryFilter ? (
              <Button className="mt-4" variant="secondary" onClick={clearFilters}>
                {t("Clear filters")}
              </Button>
            ) : (
              <Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary" href="/learning-paths">
                {t("Continue learning")}
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {visibleQuizzes.map((quiz) => (
              <li className="rounded-lg border border-border bg-surface p-5 shadow-card" key={quiz.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{t(quiz.language === "EN" ? "English" : "Vietnamese")}</Badge>
                  <Badge>{t(quiz.category)}</Badge>
                  <Badge>{t(quiz.selectionMode === "FIXED" ? "Fixed" : "Rule-based")}</Badge>
                  {tab === "technical"
                    ? quiz.knowledgeCategories.map((category) => (
                        <Badge key={category.id}>{category.name}</Badge>
                      ))
                    : null}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-text">{quiz.title}</h2>
                <div className="mt-2 space-y-1 text-sm text-text-muted">
                  <p>{t("{{count}} questions", { count: quiz.questionCount })}</p>
                  <p>{t("Pass requirement:")} {quiz.passingScore} / {quiz.maximumScore} ({quiz.passPercentage}%)</p>
                </div>
                <Link
                  className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 text-sm font-semibold text-white hover:bg-primary-solid-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
                  href={`/quizzes/${quiz.id}`}
                >
                  {t("View quiz")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label={t("Quiz pages")}>
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
            {t("Previous")}
          </Button>
          <span className="text-sm tabular-nums text-text-muted">
            {t("Page {{page}} of {{total}}", { page: page + 1, total: totalPages })}
          </span>
          <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage((value) => value + 1)}>
            {t("Next")}
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
