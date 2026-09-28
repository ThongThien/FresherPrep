"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth";
import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import {
  achievementDefinitions,
  type AchievementDefinition,
  type AchievementIcon as AchievementIconName,
} from "@/lib/dashboard/achievements";
import { useI18n, type Locale } from "@/lib/i18n";
import type {
  DashboardData,
  DashboardSection as DashboardSectionKey,
  LearningPathLessonProgress,
  LessonProgress,
  QuizAttemptSummary,
} from "@/lib/dashboard/types";

type DashboardState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardData }
  | { status: "error"; message: string };

export function Dashboard() {
  const user = useCurrentUser();
  const { t } = useI18n();
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=%2Fdashboard");
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setState({ status: "error", message: error.message });
          return;
        }
        setState({ status: "ready", data: (await response.json()) as DashboardData });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          message: t("Unable to load your learning dashboard. Check your connection and try again."),
        });
      });

    return () => controller.abort();
  }, [requestVersion, t]);

  function retry() {
    setState({ status: "loading" });
    setRequestVersion((current) => current + 1);
  }

  if (state.status === "loading") return <DashboardSkeleton />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <header>
        <p className="text-sm font-medium text-primary">{t("Learning dashboard")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {t("Welcome back, {{name}}", { name: user.displayName })}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
          {t("Pick up your Java learning from where you stopped and keep the next step clear.")}
        </p>
      </header>

      {state.status === "error" ? (
        <div className="max-w-2xl">
          <Feedback tone="error" title={t("Dashboard unavailable")}>
            {state.message}
          </Feedback>
          <Button variant="secondary" className="mt-4" onClick={retry}>
            {t("Try again")}
          </Button>
        </div>
      ) : (
        <DashboardContent data={state.data} onRetry={retry} />
      )}
    </div>
  );
}

function DashboardContent({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const { locale, t } = useI18n();
  const latestPath = data.paths.content[0];
  const continueLesson = useMemo(() => selectContinueLesson(data, t, locale), [data, locale, t]);

  return (
    <>
      <ContinueLearning
        lesson={continueLesson}
        hasJoinedPath={data.paths.totalElements > 0}
        pathCompleted={data.latestPathProgress?.completed ?? false}
        hasDataError={hasAnyIssue(data, ["lessons", "paths", "pathProgress"])}
        onRetry={onRetry}
      />

      <DashboardSection
        eyebrow={t("Current progress")}
        title={t("Latest joined learning path")}
        description={t("Progress reflects required lesson weights calculated by FresherPrep.")}
        action={<TextLink href="/learning-paths">{t("All learning paths")}</TextLink>}
      >
        {data.issues.includes("paths") ? (
          <SectionError message={t("Your learning paths could not be loaded.")} onRetry={onRetry} />
        ) : latestPath ? (
          <CurrentPath
            membership={latestPath}
            progress={data.latestPathProgress}
            progressUnavailable={data.issues.includes("pathProgress")}
          />
        ) : (
          <EmptyState
            title={t("No learning path joined yet")}
            description={t("Choose a structured path to organize lessons and track required progress.")}
            href="/learning-paths"
            action={t("Browse learning paths")}
          />
        )}
      </DashboardSection>

      <Achievements data={data} onRetry={onRetry} />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <DashboardSection
          eyebrow={t("Your curriculum")}
          title={t("Learning paths")}
          description={t("Recently joined paths, kept compact so your next action stays visible.")}
          action={<TextLink href="/learning-paths">{t("Browse paths")}</TextLink>}
        >
          {data.issues.includes("paths") ? (
            <SectionError message={t("Learning paths are temporarily unavailable.")} onRetry={onRetry} />
          ) : data.paths.content.length ? (
            <LearningPathList paths={data.paths.content} />
          ) : (
            <EmptyState
              title={t("Build your learning plan")}
              description={t("Join a published learning path to see it here.")}
              href="/learning-paths"
              action={t("Explore learning paths")}
            />
          )}
        </DashboardSection>

        <DashboardSection
          eyebrow={t("Recent work")}
          title={t("Learning activity")}
          description={t("Your latest lesson and quiz activity.")}
          action={<TextLink href="/progress">{t("View progress")}</TextLink>}
        >
          {data.issues.includes("lessons") && data.issues.includes("quizAttempts") ? (
            <SectionError message={t("Recent activity could not be loaded.")} onRetry={onRetry} />
          ) : (
            <RecentActivity
              lessons={data.lessonProgress.content}
              attempts={data.quizAttempts.content}
            />
          )}
        </DashboardSection>
      </div>

      <LearningStatistics data={data} />
    </>
  );
}

function Achievements({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const { t } = useI18n();
  const unlocked = achievementDefinitions.filter((item) => {
    const value = data.achievementProgress[item.source];
    return value !== null && value >= item.target;
  }).length;
  const unavailable =
    data.issues.includes("achievements") ||
    achievementDefinitions.some((item) => data.achievementProgress[item.source] === null);

  return (
    <DashboardSection
      eyebrow={t("Milestones")}
      title={t("Achievements")}
      description={t("Small milestones based on your actual lesson and quiz progress.")}
      action={<Badge variant={unlocked > 0 ? "success" : "neutral"}>{t("{{count}} of {{total}} unlocked", { count: unlocked, total: achievementDefinitions.length })}</Badge>}
    >
      {unavailable ? (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-warning/25 bg-warning-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warning-strong">{t("Some achievement progress is temporarily unavailable.")}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>{t("Try again")}</Button>
        </div>
      ) : null}
      <div
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3"
        aria-label={t("Achievement list")}
      >
        {achievementDefinitions.map((achievement) => (
          <AchievementCard
            key={achievement.code}
            achievement={achievement}
            current={data.achievementProgress[achievement.source]}
          />
        ))}
      </div>
    </DashboardSection>
  );
}

function AchievementCard({ achievement, current }: { achievement: AchievementDefinition; current: number | null }) {
  const { t } = useI18n();
  const unlocked = current !== null && current >= achievement.target;
  const progress = current === null ? 0 : Math.min(100, (current / achievement.target) * 100);

  return (
    <article
      className={`w-[17rem] shrink-0 snap-start rounded-lg border p-4 transition-[border-color,background-color] motion-reduce:transition-none ${
        unlocked ? "border-success/30 bg-success-subtle" : "border-border bg-surface"
      }`}
      aria-label={`${t(achievement.title)}: ${current === null ? t("Unavailable") : unlocked ? t("Unlocked") : t("Not yet unlocked")}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${
            unlocked
              ? "border-success/25 bg-surface text-success-strong"
              : "border-border bg-surface-muted text-text-subtle"
          }`}
          aria-hidden="true"
        >
          <AchievementIcon icon={achievement.icon} />
        </span>
        <Badge variant={unlocked ? "success" : "neutral"}>
          {current === null ? t("Unavailable") : unlocked ? t("Unlocked") : t("In progress")}
        </Badge>
      </div>
      <h3 className="mt-4 font-semibold text-text">{t(achievement.title)}</h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-text-muted">{t(achievement.description)}</p>
      {current !== null ? (
        <div className="mt-4">
          <Progress
            value={progress}
            label={t("{{current}} of {{target}}", { current: Math.min(current, achievement.target), target: achievement.target })}
          />
          <p className="mt-2 text-xs font-medium tabular-nums text-text-subtle">
            {unlocked
              ? t("Achievement unlocked")
              : t("{{current}} / {{target}} complete", { current: Math.min(current, achievement.target), target: achievement.target })}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-text-subtle">{t("Progress data could not be loaded.")}</p>
      )}
    </article>
  );
}

function AchievementIcon({ icon }: { icon: AchievementIconName }) {
  if (icon === "book") {
    return <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>;
  }
  if (icon === "stack") {
    return <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></svg>;
  }
  if (icon === "quiz") {
    return <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h5M8 16h3" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6" /></svg>;
}

interface ContinueLesson {
  id: string;
  title: string;
  completed: boolean;
  position?: number;
  total?: number;
  context: string;
}

function ContinueLearning({
  lesson,
  hasJoinedPath,
  pathCompleted,
  hasDataError,
  onRetry,
}: {
  lesson: ContinueLesson | null;
  hasJoinedPath: boolean;
  pathCompleted: boolean;
  hasDataError: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="continue-learning-title">
      <div className="overflow-hidden rounded-lg border border-primary/20 bg-surface shadow-card">
        <div className="border-l-4 border-primary p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {t("Continue learning")}
              </p>
              {lesson ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <h2 id="continue-learning-title" className="text-xl font-semibold text-text sm:text-2xl">
                      {lesson.title}
                    </h2>
                    {lesson.completed ? <Badge variant="success">{t("Completed")}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{lesson.context}</p>
                  {lesson.position && lesson.total ? (
                    <p className="mt-3 text-xs font-medium text-text-subtle">
                      {t("Lesson {{position}} of {{total}}", { position: lesson.position, total: lesson.total })}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 id="continue-learning-title" className="mt-3 text-xl font-semibold text-text sm:text-2xl">
                    {pathCompleted ? t("Your latest path is complete") : t("Choose your next learning path")}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                    {pathCompleted
                      ? t("Review completed lessons or select another path when you are ready.")
                      : hasJoinedPath
                        ? t("This path has no available lesson to continue right now.")
                        : t("Join a published path to get an ordered lesson plan and reliable progress tracking.")}
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0">
              {lesson ? (
                <ActionLink href={`/lessons/${lesson.id}`}>
                  {lesson.completed ? t("Review lesson") : t("Continue lesson")}
                </ActionLink>
              ) : hasDataError ? (
                <Button variant="secondary" onClick={onRetry}>{t("Try again")}</Button>
              ) : (
                <ActionLink href="/learning-paths">{t("Browse learning paths")}</ActionLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CurrentPath({
  membership,
  progress,
  progressUnavailable,
}: {
  membership: DashboardData["paths"]["content"][number];
  progress: DashboardData["latestPathProgress"];
  progressUnavailable: boolean;
}) {
  const { t } = useI18n();
  const path = membership.learningPath;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text">{path.name}</h3>
            {progress?.completed ? <Badge variant="success">{t("Completed")}</Badge> : <Badge>{t("In progress")}</Badge>}
          </div>
          <p className="mt-1 text-sm text-text-muted">{path.technologyName}</p>
        </div>
        <TextLink href={`/learning-paths/${path.id}`}>{t("View path")}</TextLink>
      </div>

      {progress ? (
        <div className="mt-6">
          <Progress value={progress.progressPercentage} label={t("Required progress")} showValue />
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <span>{t("{{completed}} of {{total}} required lessons complete", { completed: progress.completedRequiredItems, total: progress.requiredItems })}</span>
            <span>{t("{{completed}} of {{total}} total lessons complete", { completed: progress.completedItems, total: progress.totalItems })}</span>
          </div>
        </div>
      ) : progressUnavailable ? (
        <p className="mt-5 border-t border-border pt-4 text-sm text-text-muted">
          {t("Progress is temporarily unavailable. The learning path is still accessible.")}
        </p>
      ) : null}
    </div>
  );
}

function LearningPathList({ paths }: { paths: DashboardData["paths"]["content"] }) {
  const { locale, t } = useI18n();
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface shadow-card">
      {paths.map((membership) => (
        <li key={membership.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <Link
              href={`/learning-paths/${membership.learningPath.id}`}
              className="font-semibold text-text transition-colors hover:text-primary focus-visible:rounded-sm"
            >
              {membership.learningPath.name}
            </Link>
            <p className="mt-1 text-sm text-text-muted">
              {t("{{technology}} · Joined {{date}}", { technology: membership.learningPath.technologyName, date: formatDate(membership.joinedAt, locale) })}
            </p>
          </div>
          <TextLink href={`/learning-paths/${membership.learningPath.id}`}>{t("View")}</TextLink>
        </li>
      ))}
    </ul>
  );
}

function RecentActivity({ lessons, attempts }: { lessons: LessonProgress[]; attempts: QuizAttemptSummary[] }) {
  const { locale, t } = useI18n();
  const activities = useMemo(() => {
    const lessonItems = lessons.map((lesson) => ({
      id: `lesson-${lesson.lessonId}`,
      title: lesson.lessonTitle,
      label: lesson.completed ? t("Lesson completed") : t("Lesson viewed"),
      date: lesson.lastViewedAt,
      href: `/lessons/${lesson.lessonId}`,
      tone: lesson.completed ? "success" as const : "neutral" as const,
    }));
    const quizItems = attempts.map((attempt) => ({
      id: `quiz-${attempt.id}`,
      title: attempt.quizTitle,
      label:
        attempt.status === "SUBMITTED"
          ? attempt.passed
            ? t("Quiz passed")
            : t("Quiz submitted")
          : t("Quiz in progress"),
      date: attempt.submittedAt ?? attempt.startedAt,
      href: attempt.status === "SUBMITTED"
        ? `/quizzes/${attempt.quizId}/attempts/${attempt.id}/result`
        : `/quizzes/${attempt.quizId}/attempts/${attempt.id}`,
      tone: attempt.passed ? "success" as const : "neutral" as const,
    }));
    return [...lessonItems, ...quizItems]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 6);
  }, [attempts, lessons, t]);

  if (!activities.length) {
    return (
      <EmptyState
        title={t("No recent activity")}
        description={t("Start a lesson or quiz and your latest work will appear here.")}
        href="/learning-paths"
        action={t("Start learning")}
      />
    );
  }

  return (
    <ol className="divide-y divide-border border-y border-border">
      {activities.map((activity) => (
        <li key={activity.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Link href={activity.href} className="font-medium text-text hover:text-primary focus-visible:rounded-sm">
                {activity.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={activity.tone}>{activity.label}</Badge>
                <time dateTime={activity.date} className="text-xs text-text-subtle">
                  {formatDate(activity.date, locale)}
                </time>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LearningStatistics({ data }: { data: DashboardData }) {
  const { t } = useI18n();
  const stats = [
    { label: t("Paths joined"), value: data.issues.includes("paths") ? "—" : data.paths.totalElements },
    { label: t("Lessons started"), value: data.issues.includes("lessons") ? "—" : data.lessonProgress.totalElements },
    { label: t("Quiz attempts"), value: data.issues.includes("quizAttempts") ? "—" : data.quizAttempts.totalElements },
  ];

  return (
    <DashboardSection
      eyebrow={t("At a glance")}
      title={t("Learning statistics")}
      description={t("Simple totals supported directly by your learning history.")}
    >
      <dl className="grid divide-y divide-border rounded-lg border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 sm:p-6">
            <dt className="text-sm text-text-muted">{stat.label}</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums text-text">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </DashboardSection>
  );
}

function DashboardSection({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id}>
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{eyebrow}</p>
          <h2 id={id} className="mt-1 text-xl font-semibold tracking-tight text-text">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ title, description, href, action }: { title: string; description: string; href: string; action: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface px-5 py-8 text-center">
      <h3 className="font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">{description}</p>
      <TextLink href={href} className="mt-4 inline-flex">{action}</TextLink>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg border border-danger/20 bg-danger-subtle p-5">
      <p className="text-sm font-medium text-danger-strong">{message}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>{t("Try again")}</Button>
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

function TextLink({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`rounded-sm text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${className}`}
    >
      {children} <span aria-hidden="true">→</span>
    </Link>
  );
}

function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-10 motion-reduce:animate-none" role="status">
      <span className="sr-only">{t("Loading dashboard")}</span>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-surface-strong" />
        <div className="h-8 w-72 max-w-full rounded bg-surface-strong" />
        <div className="h-4 w-full max-w-xl rounded bg-surface-strong" />
      </div>
      <div className="h-48 rounded-lg border border-border bg-surface" />
      <div className="space-y-4">
        <div className="h-6 w-52 rounded bg-surface-strong" />
        <div className="h-44 rounded-lg border border-border bg-surface" />
      </div>
      <div className="space-y-4">
        <div className="h-6 w-44 rounded bg-surface-strong" />
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-52 w-[17rem] shrink-0 rounded-lg border border-border bg-surface" />)}
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-64 rounded-lg border border-border bg-surface" />
        <div className="h-64 rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}

function selectContinueLesson(data: DashboardData, t: (key: string, values?: Record<string, string | number>) => string, locale: Locale): ContinueLesson | null {
  const latest = data.lessonProgress.content[0];
  const pathLessons = [...(data.latestPathProgress?.lessons ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  if (latest && !latest.completed) return fromLessonProgress(latest, pathLessons, t, locale);

  const nextPathLesson = pathLessons.find((lesson) => !lesson.completed);
  if (nextPathLesson) return fromPathLesson(nextPathLesson, pathLessons, t);

  return latest ? fromLessonProgress(latest, pathLessons, t, locale) : null;
}

function fromLessonProgress(lesson: LessonProgress, pathLessons: LearningPathLessonProgress[], t: (key: string, values?: Record<string, string | number>) => string, locale: Locale): ContinueLesson {
  const pathIndex = pathLessons.findIndex((item) => item.lessonId === lesson.lessonId);
  return {
    id: lesson.lessonId,
    title: lesson.lessonTitle,
    completed: lesson.completed,
    position: pathIndex >= 0 ? pathIndex + 1 : undefined,
    total: pathIndex >= 0 ? pathLessons.length : undefined,
    context: lesson.completed
      ? t("Completed lesson · Last viewed {{date}}", { date: formatDate(lesson.lastViewedAt, locale) })
      : t("Last viewed {{date}} · {{percent}}% maximum scroll", { date: formatDate(lesson.lastViewedAt, locale), percent: lesson.maxScrollPercent }),
  };
}

function fromPathLesson(lesson: LearningPathLessonProgress, pathLessons: LearningPathLessonProgress[], t: (key: string) => string): ContinueLesson {
  return {
    id: lesson.lessonId,
    title: lesson.lessonTitle,
    completed: lesson.completed,
    position: pathLessons.findIndex((item) => item.lessonId === lesson.lessonId) + 1,
    total: pathLessons.length,
    context: lesson.required ? t("Next required lesson in your latest joined path") : t("Next lesson in your latest joined path"),
  };
}

function hasAnyIssue(data: DashboardData, sections: DashboardSectionKey[]) {
  return sections.some((section) => data.issues.includes(section));
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "vi" ? "Gần đây" : "Recently";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
