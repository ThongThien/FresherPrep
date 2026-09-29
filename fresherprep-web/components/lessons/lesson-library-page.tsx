"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, Input, Label, LoadingState } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { PageResponse } from "@/lib/dashboard/types";
import { useI18n } from "@/lib/i18n";
import type { LessonSummary } from "@/lib/lessons/types";

export function LessonLibraryPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<LessonSummary>>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set("q", query);

    void fetch("/api/lessons?" + params.toString(), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=%2Flessons");
          return;
        }
        if (!response.ok) {
          setError((await readApiError(response)).message);
          return;
        }
        setData(await response.json() as PageResponse<LessonSummary>);
        setError(undefined);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(t("Unable to load published lessons."));
        }
      });
    return () => controller.abort();
  }, [page, query, reload, t]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setData(undefined);
    setPage(0);
    setQuery(draftQuery.trim());
  }

  function clearSearch() {
    setDraftQuery("");
    setQuery("");
    setPage(0);
    setData(undefined);
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-3xl py-10">
        <Feedback tone="error" title={t("Lessons unavailable")}>{error}</Feedback>
        <Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setReload((value) => value + 1); }}>{t("Try again")}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-primary">{t("Lesson library")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{t("Published lessons")}</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
          {t("Choose any published lesson to study independently. Reading progress and completion requirements work the same as lessons in a learning path.")}
        </p>
      </header>

      <form className="mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end" onSubmit={search}>
        <div className="min-w-0 flex-1">
          <Label htmlFor="lesson-library-search">{t("Find a lesson")}</Label>
          <Input
            id="lesson-library-search"
            value={draftQuery}
            maxLength={200}
            placeholder={t("Search by title or slug")}
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">{t("Search")}</Button>
          {query ? <Button type="button" variant="secondary" onClick={clearSearch}>{t("Clear")}</Button> : null}
        </div>
      </form>

      {error && data ? <Feedback className="mt-6" tone="warning" title={t("Unable to refresh")}>{error}</Feedback> : null}

      <div className="mt-8">
        {!data ? (
          <LoadingState title={t("Loading published lessons...")} description={t("Please wait a moment.")} />
        ) : data.content.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.content.map((lesson) => (
              <li key={lesson.id}>
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">{t("Published")}</Badge>
                      <Badge>{t("Lesson")}</Badge>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold leading-7 text-text">
                      <Link className="transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20" href={"/lessons/" + lesson.id}>
                        {lesson.title}
                      </Link>
                    </h2>
                    <p className="mt-1 break-all font-mono text-xs text-text-subtle">{lesson.slug}</p>
                    <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-text-muted">{t("Minimum reading")}</dt>
                        <dd className="mt-1 font-semibold text-text">{t("{{seconds}} seconds", { seconds: lesson.minimumReadSeconds })}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-text-muted">{t("Required scroll")}</dt>
                        <dd className="mt-1 font-semibold text-text">{lesson.requiredScrollPercent}%</dd>
                      </div>
                    </dl>
                    <Link
                      className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 text-sm font-semibold text-white shadow-button transition-colors hover:bg-primary-solid-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
                      href={"/lessons/" + lesson.id}
                    >
                      {t("Read lesson")}
                    </Link>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-text">{t(query ? "No lessons match your search" : "No published lessons")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
              {t(query ? "Try a different title or clear the search." : "Published lessons will appear here when they are available.")}
            </p>
            {query ? <Button className="mt-5" variant="secondary" onClick={clearSearch}>{t("Clear search")}</Button> : null}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 ? (
        <nav className="mt-7 flex items-center justify-between gap-4" aria-label={t("Lesson pages")}>
          <Button variant="secondary" disabled={data.first} onClick={() => { setData(undefined); setPage((value) => value - 1); }}>{t("Previous")}</Button>
          <span className="text-sm tabular-nums text-text-muted">{t("Page {{page}} of {{total}}", { page: data.number + 1, total: data.totalPages })}</span>
          <Button variant="secondary" disabled={data.last} onClick={() => { setData(undefined); setPage((value) => value + 1); }}>{t("Next")}</Button>
        </nav>
      ) : null}
    </div>
  );
}
