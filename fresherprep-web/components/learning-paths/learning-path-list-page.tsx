"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth";
import {
  Badge,
  Button,
  Feedback,
  Input,
  Label,
  LoadingState,
  Progress,
} from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import {
  readLearningPathListCache,
  writeLearningPathListCache,
} from "@/lib/learning-paths/cache";
import type {
  LearningPathListData,
  LearningPathListEntry,
} from "@/lib/learning-paths/types";
import { useI18n } from "@/lib/i18n";

type ListState =
  | { status: "loading" }
  | { status: "ready"; data: LearningPathListData }
  | { status: "error"; message: string };

export function LearningPathListPage() {
  const { locale, t } = useI18n();
  const user = useCurrentUser();
  const [cachedData] = useState<LearningPathListData | undefined>(() =>
    readLearningPathListCache(user.id),
  );
  const [state, setState] = useState<ListState>(() =>
    cachedData
      ? { status: "ready", data: cachedData }
      : { status: "loading" },
  );
  const [requestVersion, setRequestVersion] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (cachedData && requestVersion === 0) return;
    const controller = new AbortController();
    void fetch("/api/learning-paths", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=%2Flearning-paths");
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setState({ status: "error", message: error.message });
          return;
        }
        const data = (await response.json()) as LearningPathListData;
        writeLearningPathListCache(user.id, data);
        setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          message: t(
            "Unable to load learning paths. Check your connection and try again.",
          ),
        });
      });

    return () => controller.abort();
  }, [cachedData, requestVersion, t, user.id]);

  const numberedEntries = useMemo(() => {
    if (state.status !== "ready") return [];
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return [...state.data.entries]
      .sort((left, right) => {
        const created = left.path.createdAt.localeCompare(right.path.createdAt);
        return created || left.path.id.localeCompare(right.path.id);
      })
      .map((entry, index) => ({ entry, order: index + 1 }))
      .filter(({ entry }) =>
        !normalizedQuery ||
        entry.path.name.toLocaleLowerCase().includes(normalizedQuery) ||
        entry.path.technologyName.toLocaleLowerCase().includes(normalizedQuery),
      );
  }, [query, state]);

  function retry() {
    setState({ status: "loading" });
    setRequestVersion((current) => current + 1);
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-primary">
          {t("Structured curriculum")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {t("Learning Paths")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
          {t(
            "Learning paths are numbered by creation order. Follow the numbers from smallest to largest if you want to study along the recommended roadmap.",
          )}
        </p>
      </header>

      {state.status === "ready" ? (
        <div className="mt-7 max-w-xl">
          <Label htmlFor="learning-path-search">{t("Find a learning path")}</Label>
          <Input
            id="learning-path-search"
            value={query}
            placeholder={t("Search by path or technology")}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-8">
        {state.status === "loading" ? <LearningPathListSkeleton /> : null}
        {state.status === "error" ? (
          <div className="max-w-2xl">
            <Feedback tone="error" title={t("Learning paths unavailable")}>
              {state.message}
            </Feedback>
            <Button variant="secondary" className="mt-4" onClick={retry}>
              {t("Try again")}
            </Button>
          </div>
        ) : null}
        {state.status === "ready" ? (
          <LearningPathGrid
            data={state.data}
            entries={numberedEntries}
            hasQuery={Boolean(query.trim())}
            locale={locale}
          />
        ) : null}
      </div>
    </div>
  );
}

function LearningPathGrid({
  data,
  entries,
  hasQuery,
  locale,
}: {
  data: LearningPathListData;
  entries: Array<{ entry: LearningPathListEntry; order: number }>;
  hasQuery: boolean;
  locale: "vi" | "en";
}) {
  const { t } = useI18n();
  return (
    <>
      {data.membershipUnavailable ? (
        <Feedback
          tone="warning"
          title={t("Personal progress is temporarily unavailable")}
          className="mb-5"
        >
          {t(
            "You can still inspect published learning paths. Join and progress actions are hidden until account data is available.",
          )}
        </Feedback>
      ) : null}

      {entries.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(({ entry, order }) => (
            <LearningPathCard
              key={entry.path.id}
              entry={entry}
              order={order}
              locale={locale}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-text">
            {t(hasQuery ? "No learning paths match your search" : "No published learning paths")}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
            {t(
              hasQuery
                ? "Try another path name or technology."
                : "Published curricula will appear here when they are available.",
            )}
          </p>
        </div>
      )}
    </>
  );
}

function LearningPathCard({
  entry,
  order,
  locale,
}: {
  entry: LearningPathListEntry;
  order: number;
  locale: "vi" | "en";
}) {
  const { t } = useI18n();
  const action = entry.joined ? t("Continue") : t("View path");

  return (
    <li className="flex min-h-full flex-col rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className="font-mono text-3xl font-semibold tabular-nums text-primary"
          aria-label={t("Learning path number {{number}}", { number: order })}
        >
          {String(order).padStart(2, "0")}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          {entry.joined === true ? <Badge variant="info">{t("Joined")}</Badge> : null}
          {entry.joined === false ? <Badge>{t("Available")}</Badge> : null}
          {entry.joined === null ? <Badge variant="warning">{t("Status unavailable")}</Badge> : null}
        </div>
      </div>

      <h2 className="mt-5 text-lg font-semibold leading-7 text-text">
        <Link
          href={`/learning-paths/${entry.path.id}`}
          className="transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
        >
          {entry.path.name}
        </Link>
      </h2>
      <p className="mt-1 text-sm text-text-muted">{entry.path.technologyName}</p>
      <p className="mt-2 text-xs text-text-subtle">
        {t("Created {{date}}", {
          date: new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", {
            dateStyle: "medium",
          }).format(new Date(entry.path.createdAt)),
        })}
      </p>

      <div className="mt-auto pt-6">
        {entry.progress ? (
          <>
            <Progress
              value={entry.progress.progressPercentage}
              label={t("Required progress")}
              showValue
              tone={entry.progress.completed ? "success" : "primary"}
            />
            <p className="mt-2 text-xs text-text-subtle">
              {t("{{completed}} of {{total}} required lessons complete", {
                completed: entry.progress.completedRequiredItems,
                total: entry.progress.requiredItems,
              })}
            </p>
          </>
        ) : entry.progressUnavailable ? (
          <p className="text-sm text-text-muted">
            {t("Progress is temporarily unavailable.")}
          </p>
        ) : null}

        <Link
          href={`/learning-paths/${entry.path.id}`}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-sm font-semibold text-white shadow-button transition-[background-color,border-color,transform] hover:border-primary-solid-hover hover:bg-primary-solid-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
        >
          {action}
        </Link>
      </div>
    </li>
  );
}

function LearningPathListSkeleton() {
  const { t } = useI18n();
  return (
    <LoadingState
      title={t("Loading learning paths...")}
      description={t("Please wait a moment.")}
    />
  );
}
