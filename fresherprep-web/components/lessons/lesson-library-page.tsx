"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, Input, Label, LoadingState, Select } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { PageResponse } from "@/lib/dashboard/types";
import { useI18n } from "@/lib/i18n";
import type { LessonSummary } from "@/lib/lessons/types";

export function LessonLibraryPage() {
  const { t } = useI18n();
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<LessonSummary>>();
  const [error, setError] = useState<string>();
  const topics = useMemo(() => {
    const unique = new Map<string, string>();
    data?.content.forEach((lesson) => unique.set(lesson.topicId ?? "other", lesson.topicName ?? t("Other topic")));
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data, t]);
  const groupedLessons = useMemo(() => {
    const groups = new Map<string, { name: string; lessons: LessonSummary[] }>();
    data?.content
      .filter((lesson) => {
        const normalizedQuery = query.toLocaleLowerCase();
        const matchesQuery = !normalizedQuery || lesson.title.toLocaleLowerCase().includes(normalizedQuery) || lesson.slug.toLocaleLowerCase().includes(normalizedQuery);
        const matchesTopic = !topicFilter || (lesson.topicId ?? "other") === topicFilter;
        return matchesQuery && matchesTopic;
      })
      .forEach((lesson) => {
        const key = lesson.topicId ?? "other";
        const group = groups.get(key) ?? { name: lesson.topicName ?? t("Other topic"), lessons: [] };
        group.lessons.push(lesson);
        groups.set(key, group);
      });
    return [...groups.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [data, query, topicFilter, t]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/lessons", {
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
  }, [reload, t]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draftQuery.trim());
  }

  function clearSearch() {
    setDraftQuery("");
    setQuery("");
    setTopicFilter("");
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

      <form className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.55fr)_auto] sm:items-end" onSubmit={search}>
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
        <div>
          <Label htmlFor="lesson-topic-filter">{t("Topic")}</Label>
          <Select id="lesson-topic-filter" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
            <option value="">{t("All topics")}</option>
            {topics.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit">{t("Search")}</Button>
          {query || topicFilter ? <Button type="button" variant="secondary" onClick={clearSearch}>{t("Clear")}</Button> : null}
        </div>
      </form>

      {error && data ? <Feedback className="mt-6" tone="warning" title={t("Unable to refresh")}>{error}</Feedback> : null}

      <div className="mt-8">
        {!data ? (
          <LoadingState title={t("Loading published lessons...")} description={t("Please wait a moment.")} />
        ) : groupedLessons.length ? (
          <div className="space-y-9">{groupedLessons.map(([topicId, group]) => <section key={topicId} aria-labelledby={`topic-${topicId}`}><div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3"><h2 className="text-xl font-semibold text-text" id={`topic-${topicId}`}>{group.name}</h2><span className="text-sm text-text-muted">{t("{{count}} lessons", { count: group.lessons.length })}</span></div><ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{group.lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}</ul></section>)}</div>
        ) : (
          <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-text">{t(query || topicFilter ? "No lessons match your search" : "No published lessons")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
              {t(query || topicFilter ? "Try a different title or clear the search." : "Published lessons will appear here when they are available.")}
            </p>
            {query || topicFilter ? <Button className="mt-5" variant="secondary" onClick={clearSearch}>{t("Clear search")}</Button> : null}
          </div>
        )}
      </div>

    </div>
  );
}

function LessonCard({ lesson }: { lesson: LessonSummary }) {
  const { t } = useI18n();
  return <li><Card className="h-full"><CardContent className="flex h-full flex-col"><div className="flex flex-wrap items-center gap-2"><Badge variant="success">{t("Published")}</Badge><Badge>{lesson.subtopicName ?? t("Lesson")}</Badge></div><h3 className="mt-4 text-lg font-semibold leading-7 text-text"><Link className="transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20" href={"/lessons/" + lesson.id}>{lesson.title}</Link></h3><p className="mt-1 break-all font-mono text-xs text-text-subtle">{lesson.slug}</p><dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-text-muted">{t("Minimum reading")}</dt><dd className="mt-1 font-semibold text-text">{t("{{seconds}} seconds", { seconds: lesson.minimumReadSeconds })}</dd></div><div><dt className="text-xs text-text-muted">{t("Required scroll")}</dt><dd className="mt-1 font-semibold text-text">{lesson.requiredScrollPercent}%</dd></div></dl><Link className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 text-sm font-semibold text-white shadow-button transition-colors hover:bg-primary-solid-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25" href={"/lessons/" + lesson.id}>{t("Read lesson")}</Link></CardContent></Card></li>;
}
