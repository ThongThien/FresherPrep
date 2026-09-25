"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type {
  LearningPathDetailData,
  LearningPathItem,
} from "@/lib/learning-paths/types";

import { CurriculumList } from "./curriculum-list";

type DetailState =
  | { status: "loading" }
  | { status: "ready"; data: LearningPathDetailData }
  | { status: "not-found" }
  | { status: "error"; message: string };

export function LearningPathDetailPage({ pathId }: { pathId: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<DetailState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string>();
  const [joinedNotice, setJoinedNotice] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/learning-paths/${encodeURIComponent(pathId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace(`/login?next=${encodeURIComponent(`/learning-paths/${pathId}`)}`);
          return;
        }
        if (response.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setState({ status: "error", message: error.message });
          return;
        }
        setState({ status: "ready", data: (await response.json()) as LearningPathDetailData });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          message: t("Unable to load this learning path. Check your connection and try again."),
        });
      });

    return () => controller.abort();
  }, [pathId, requestVersion, t]);

  function retry() {
    setState({ status: "loading" });
    setRequestVersion((current) => current + 1);
  }

  async function joinPath() {
    if (joining) return;
    setJoining(true);
    setJoinError(undefined);

    try {
      const response = await fetch(`/api/learning-paths/${encodeURIComponent(pathId)}`, {
        method: "POST",
      });
      if (response.status === 401) {
        window.location.replace(`/login?next=${encodeURIComponent(`/learning-paths/${pathId}`)}`);
        return;
      }
      if (!response.ok && response.status !== 409) {
        const error = await readApiError(response);
        setJoinError(error.message);
        return;
      }

      setJoinedNotice(true);
      setState({ status: "loading" });
      setRequestVersion((current) => current + 1);
    } catch {
      setJoinError(t("Unable to join this learning path. Check your connection and try again."));
    } finally {
      setJoining(false);
    }
  }

  if (state.status === "loading") return <LearningPathDetailSkeleton />;

  if (state.status === "not-found") {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <p className="text-sm font-medium text-primary">{t("Learning path")}</p>
        <h1 className="mt-2 text-2xl font-semibold text-text">{t("Learning path not found")}</h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          {t("This path may not exist or may no longer be published.")}
        </p>
        <BackLink className="mt-6 inline-flex" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Feedback tone="error" title={t("Learning path unavailable")}>{state.message}</Feedback>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={retry}>{t("Try again")}</Button>
          <BackLink />
        </div>
      </div>
    );
  }

  return (
    <LearningPathDetailContent
      data={state.data}
      joining={joining}
      joinError={joinError}
      joinedNotice={joinedNotice}
      onJoin={joinPath}
      onRetry={retry}
    />
  );
}

function LearningPathDetailContent({
  data,
  joining,
  joinError,
  joinedNotice,
  onJoin,
  onRetry,
}: {
  data: LearningPathDetailData;
  joining: boolean;
  joinError?: string;
  joinedNotice: boolean;
  onJoin: () => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  const orderedItems = useMemo(
    () => [...data.path.items].sort((a, b) => a.displayOrder - b.displayOrder),
    [data.path.items],
  );
  const continueLesson = useMemo(
    () => findContinueLesson(data, orderedItems),
    [data, orderedItems],
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <nav aria-label={t("Breadcrumb")}>
        <Link
          href="/learning-paths"
          className="inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
        >
          <span aria-hidden="true">←</span>&nbsp; {t("Learning Paths")}
        </Link>
      </nav>

      <header className="mt-5 border-b border-border pb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{data.path.technologyName}</Badge>
              {data.joined === true ? <Badge variant="success">{t("Joined")}</Badge> : null}
              {data.joined === false ? <Badge>{t("Available")}</Badge> : null}
              {data.joined === null ? <Badge variant="warning">{t("Membership unavailable")}</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
              {data.path.name}
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-muted sm:text-base">
              {t("A structured {{technology}} curriculum with {{count}} ordered lessons.", { technology: data.path.technologyName, count: data.path.items.length })}
            </p>
          </div>

          <PrimaryPathAction
            data={data}
            continueLesson={continueLesson}
            joining={joining}
            onJoin={onJoin}
            onRetry={onRetry}
          />
        </div>

        {joinError ? (
          <Feedback tone="error" title={t("Unable to join")} className="mt-5 max-w-2xl">
            {joinError}
          </Feedback>
        ) : null}
        {joinedNotice && data.joined === true ? (
          <Feedback tone="success" title={t("Learning path joined")} className="mt-5 max-w-2xl">
            {t("Your curriculum and progress tracking are ready.")}
          </Feedback>
        ) : null}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <main>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{t("Curriculum")}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-text">{t("Ordered learning content")}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {t("Follow the display order. Required and optional lessons are identified separately.")}
            </p>
          </div>
          <CurriculumList data={data} continueLessonId={continueLesson?.lessonId} />
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24" aria-label={t("Learning path progress")}>
          <PathProgressSummary data={data} onRetry={onRetry} />
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text">{t("Curriculum structure")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label={t("Total lessons")} value={data.path.items.length} />
              <SummaryRow label={t("Required")} value={data.path.items.filter((item) => item.required).length} />
              <SummaryRow label={t("Optional")} value={data.path.items.filter((item) => !item.required).length} />
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PrimaryPathAction({
  data,
  continueLesson,
  joining,
  onJoin,
  onRetry,
}: {
  data: LearningPathDetailData;
  continueLesson: LearningPathItem | null;
  joining: boolean;
  onJoin: () => void;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  if (data.joined === false) {
    return <Button size="lg" loading={joining} onClick={onJoin}>{joining ? t("Joining...") : t("Join learning path")}</Button>;
  }
  if (data.joined === null) {
    return <Button size="lg" variant="secondary" onClick={onRetry}>{t("Retry membership")}</Button>;
  }
  if (continueLesson) {
    return <ActionLink href={"/lessons/" + continueLesson.lessonId + "?pathId=" + encodeURIComponent(data.path.id)}>{t("Continue learning")}</ActionLink>;
  }
  if (data.progress?.completed) {
    return <ActionLink href={"/lessons/" + (data.path.items[0]?.lessonId ?? "") + "?pathId=" + encodeURIComponent(data.path.id)}>{t("Review curriculum")}</ActionLink>;
  }
  return <Button size="lg" variant="secondary" disabled>{t("No lesson available")}</Button>;
}

function PathProgressSummary({ data, onRetry }: { data: LearningPathDetailData; onRetry: () => void }) {
  const { t } = useI18n();
  if (data.joined !== true) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <h2 className="text-sm font-semibold text-text">{t("Progress tracking")}</h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          {t("Join this path to track required lessons and completion.")}
        </p>
      </div>
    );
  }

  if (!data.progress) {
    return (
      <div className="rounded-lg border border-warning/25 bg-warning-subtle p-5">
        <h2 className="text-sm font-semibold text-warning-strong">{t("Progress unavailable")}</h2>
        <p className="mt-2 text-sm leading-6 text-warning-strong/85">{t("Your curriculum remains available.")}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>{t("Try again")}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text">{t("Your progress")}</h2>
        {data.progress.completed ? <Badge variant="success">{t("Completed")}</Badge> : null}
      </div>
      <Progress
        className="mt-5"
        value={data.progress.progressPercentage}
        label={t("Required progress")}
        showValue
        tone={data.progress.completed ? "success" : "primary"}
      />
      <p className="mt-3 text-xs leading-5 text-text-muted">
        {t("{{completed}} of {{total}} required lessons complete", { completed: data.progress.completedRequiredItems, total: data.progress.requiredItems })}
      </p>
    </div>
  );
}

function findContinueLesson(data: LearningPathDetailData, orderedItems: LearningPathItem[]) {
  if (data.joined !== true) return null;
  const progressByLessonId = new Map(
    (data.progress?.lessons ?? []).map((progress) => [progress.lessonId, progress]),
  );
  const itemByLessonId = new Map(orderedItems.map((item) => [item.lessonId, item]));

  const recentIncomplete = data.lessonProgress.find(
    (lesson) => itemByLessonId.has(lesson.lessonId) && !progressByLessonId.get(lesson.lessonId)?.completed,
  );
  if (recentIncomplete) return itemByLessonId.get(recentIncomplete.lessonId) ?? null;

  return orderedItems.find((item) => {
    const progress = progressByLessonId.get(item.lessonId);
    return !progress?.completed && !progress?.locked;
  }) ?? null;
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-text">{value}</dd>
    </div>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-sm font-semibold text-white shadow-button transition-[background-color,border-color,transform] hover:border-primary-solid-hover hover:bg-primary-solid-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
    >
      {children}
    </Link>
  );
}

function BackLink({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  return (
    <Link
      href="/learning-paths"
      className={`min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${className}`}
    >
      {t("Back to learning paths")}
    </Link>
  );
}

function LearningPathDetailSkeleton() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse motion-reduce:animate-none" role="status">
      <span className="sr-only">{t("Loading learning path")}</span>
      <div className="h-4 w-32 rounded bg-surface-strong" />
      <div className="mt-8 h-10 w-96 max-w-full rounded bg-surface-strong" />
      <div className="mt-4 h-4 w-full max-w-2xl rounded bg-surface-strong" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-96 rounded-lg border border-border bg-surface" />
        <div className="h-52 rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}
