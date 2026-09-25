"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { LearningPathListData, LearningPathListEntry } from "@/lib/learning-paths/types";

type ListState =
  | { status: "loading" }
  | { status: "ready"; data: LearningPathListData }
  | { status: "error"; message: string };

export function LearningPathListPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/learning-paths?page=${page}`, {
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
        setState({ status: "ready", data: (await response.json()) as LearningPathListData });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          message: t("Unable to load learning paths. Check your connection and try again."),
        });
      });

    return () => controller.abort();
  }, [page, requestVersion, t]);

  function retry() {
    setState({ status: "loading" });
    setRequestVersion((current) => current + 1);
  }

  function changePage(nextPage: number) {
    setState({ status: "loading" });
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="max-w-3xl">
        <p className="text-sm font-medium text-primary">{t("Structured curriculum")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {t("Learning Paths")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
          {t("Follow an ordered Java learning plan, understand what is required, and continue from your current progress.")}
        </p>
      </header>

      <div className="mt-8">
        {state.status === "loading" ? <LearningPathListSkeleton /> : null}
        {state.status === "error" ? (
          <div className="max-w-2xl">
            <Feedback tone="error" title={t("Learning paths unavailable")}>{state.message}</Feedback>
            <Button variant="secondary" className="mt-4" onClick={retry}>{t("Try again")}</Button>
          </div>
        ) : null}
        {state.status === "ready" ? (
          <LearningPathList data={state.data} onPageChange={changePage} />
        ) : null}
      </div>
    </div>
  );
}

function LearningPathList({
  data,
  onPageChange,
}: {
  data: LearningPathListData;
  onPageChange: (page: number) => void;
}) {
  const { t } = useI18n();
  return (
    <>
      {data.membershipUnavailable ? (
        <Feedback tone="warning" title={t("Personal progress is temporarily unavailable")} className="mb-5">
          {t("You can still inspect published learning paths. Join and progress actions are hidden until account data is available.")}
        </Feedback>
      ) : null}

      {data.entries.length ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
          <ul className="divide-y divide-border">
            {data.entries.map((entry) => <LearningPathRow key={entry.path.id} entry={entry} />)}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-text">{t("No published learning paths")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
            {t("Published curricula will appear here when they are available.")}
          </p>
        </div>
      )}

      {data.paths.totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-between gap-4" aria-label={t("Learning path pages")}>
          <Button
            variant="secondary"
            disabled={data.paths.first}
            onClick={() => onPageChange(data.paths.number - 1)}
          >
            {t("Previous")}
          </Button>
          <p className="text-sm tabular-nums text-text-muted">
            {t("Page {{page}} of {{total}}", { page: data.paths.number + 1, total: data.paths.totalPages })}
          </p>
          <Button
            variant="secondary"
            disabled={data.paths.last}
            onClick={() => onPageChange(data.paths.number + 1)}
          >
            {t("Next")}
          </Button>
        </nav>
      ) : null}
    </>
  );
}

function LearningPathRow({ entry }: { entry: LearningPathListEntry }) {
  const { t } = useI18n();
  const action = entry.joined ? t("Continue") : t("View path");

  return (
    <li className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-text">
              <Link
                href={`/learning-paths/${entry.path.id}`}
                className="transition-colors hover:text-primary focus-visible:rounded-sm"
              >
                {entry.path.name}
              </Link>
            </h2>
            {entry.joined === true ? <Badge variant="info">{t("Joined")}</Badge> : null}
            {entry.joined === false ? <Badge>{t("Available")}</Badge> : null}
            {entry.joined === null ? <Badge variant="warning">{t("Status unavailable")}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-text-muted">{entry.path.technologyName}</p>

          {entry.progress ? (
            <div className="mt-5 max-w-2xl">
              <Progress
                value={entry.progress.progressPercentage}
                label={t("Required progress")}
                showValue
                tone={entry.progress.completed ? "success" : "primary"}
              />
              <p className="mt-2 text-xs text-text-subtle">
                {t("{{completed}} of {{total}} required lessons complete", { completed: entry.progress.completedRequiredItems, total: entry.progress.requiredItems })}
              </p>
            </div>
          ) : entry.progressUnavailable ? (
            <p className="mt-4 text-sm text-text-muted">{t("Progress is temporarily unavailable.")}</p>
          ) : null}
        </div>

        <Link
          href={`/learning-paths/${entry.path.id}`}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-sm font-semibold text-white shadow-button transition-[background-color,border-color,transform] hover:border-primary-solid-hover hover:bg-primary-solid-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
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
    <div className="animate-pulse overflow-hidden rounded-lg border border-border bg-surface motion-reduce:animate-none" role="status">
      <span className="sr-only">{t("Loading learning paths")}</span>
      {[0, 1, 2].map((item) => (
        <div key={item} className="border-b border-border p-6 last:border-b-0">
          <div className="h-5 w-64 max-w-full rounded bg-surface-strong" />
          <div className="mt-3 h-4 w-36 rounded bg-surface-strong" />
          <div className="mt-6 h-2.5 w-full max-w-xl rounded bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}
