"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth";
import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
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
          message: "Unable to load your learning dashboard. Check your connection and try again.",
        });
      });

    return () => controller.abort();
  }, [requestVersion]);

  function retry() {
    setState({ status: "loading" });
    setRequestVersion((current) => current + 1);
  }

  if (state.status === "loading") return <DashboardSkeleton />;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10">
      <header>
        <p className="text-sm font-medium text-primary">Learning dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Welcome back, {user.displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
          Pick up your Java learning from where you stopped and keep the next step clear.
        </p>
      </header>

      {state.status === "error" ? (
        <div className="max-w-2xl">
          <Feedback tone="error" title="Dashboard unavailable">
            {state.message}
          </Feedback>
          <Button variant="secondary" className="mt-4" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <DashboardContent data={state.data} onRetry={retry} />
      )}
    </div>
  );
}

function DashboardContent({ data, onRetry }: { data: DashboardData; onRetry: () => void }) {
  const latestPath = data.paths.content[0];
  const continueLesson = useMemo(() => selectContinueLesson(data), [data]);

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
        eyebrow="Current progress"
        title="Latest joined learning path"
        description="Progress reflects required lesson weights calculated by FresherPrep."
        action={<TextLink href="/learning-paths">All learning paths</TextLink>}
      >
        {data.issues.includes("paths") ? (
          <SectionError message="Your learning paths could not be loaded." onRetry={onRetry} />
        ) : latestPath ? (
          <CurrentPath
            membership={latestPath}
            progress={data.latestPathProgress}
            progressUnavailable={data.issues.includes("pathProgress")}
          />
        ) : (
          <EmptyState
            title="No learning path joined yet"
            description="Choose a structured path to organize lessons and track required progress."
            href="/learning-paths"
            action="Browse learning paths"
          />
        )}
      </DashboardSection>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <DashboardSection
          eyebrow="Your curriculum"
          title="Learning paths"
          description="Recently joined paths, kept compact so your next action stays visible."
          action={<TextLink href="/learning-paths">Browse paths</TextLink>}
        >
          {data.issues.includes("paths") ? (
            <SectionError message="Learning paths are temporarily unavailable." onRetry={onRetry} />
          ) : data.paths.content.length ? (
            <LearningPathList paths={data.paths.content} />
          ) : (
            <EmptyState
              title="Build your learning plan"
              description="Join a published learning path to see it here."
              href="/learning-paths"
              action="Explore learning paths"
            />
          )}
        </DashboardSection>

        <DashboardSection
          eyebrow="Recent work"
          title="Learning activity"
          description="Your latest lesson and quiz activity."
          action={<TextLink href="/progress">View progress</TextLink>}
        >
          {data.issues.includes("lessons") && data.issues.includes("quizAttempts") ? (
            <SectionError message="Recent activity could not be loaded." onRetry={onRetry} />
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
  return (
    <section aria-labelledby="continue-learning-title">
      <div className="overflow-hidden rounded-lg border border-primary/20 bg-surface shadow-card">
        <div className="border-l-4 border-primary p-6 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Continue learning
              </p>
              {lesson ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <h2 id="continue-learning-title" className="text-xl font-semibold text-text sm:text-2xl">
                      {lesson.title}
                    </h2>
                    {lesson.completed ? <Badge variant="success">Completed</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{lesson.context}</p>
                  {lesson.position && lesson.total ? (
                    <p className="mt-3 text-xs font-medium text-text-subtle">
                      Lesson {lesson.position} of {lesson.total}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 id="continue-learning-title" className="mt-3 text-xl font-semibold text-text sm:text-2xl">
                    {pathCompleted ? "Your latest path is complete" : "Choose your next learning path"}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                    {pathCompleted
                      ? "Review completed lessons or select another path when you are ready."
                      : hasJoinedPath
                        ? "This path has no available lesson to continue right now."
                        : "Join a published path to get an ordered lesson plan and reliable progress tracking."}
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0">
              {lesson ? (
                <ActionLink href={`/lessons/${lesson.id}`}>
                  {lesson.completed ? "Review lesson" : "Continue lesson"}
                </ActionLink>
              ) : hasDataError ? (
                <Button variant="secondary" onClick={onRetry}>Try again</Button>
              ) : (
                <ActionLink href="/learning-paths">Browse learning paths</ActionLink>
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
  const path = membership.learningPath;

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-text">{path.name}</h3>
            {progress?.completed ? <Badge variant="success">Completed</Badge> : <Badge>In progress</Badge>}
          </div>
          <p className="mt-1 text-sm text-text-muted">{path.technologyName}</p>
        </div>
        <TextLink href={`/learning-paths/${path.id}`}>View path</TextLink>
      </div>

      {progress ? (
        <div className="mt-6">
          <Progress value={progress.progressPercentage} label="Required progress" showValue />
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-muted">
            <span>{progress.completedRequiredItems} of {progress.requiredItems} required lessons complete</span>
            <span>{progress.completedItems} of {progress.totalItems} total lessons complete</span>
          </div>
        </div>
      ) : progressUnavailable ? (
        <p className="mt-5 border-t border-border pt-4 text-sm text-text-muted">
          Progress is temporarily unavailable. The learning path is still accessible.
        </p>
      ) : null}
    </div>
  );
}

function LearningPathList({ paths }: { paths: DashboardData["paths"]["content"] }) {
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
              {membership.learningPath.technologyName} · Joined {formatDate(membership.joinedAt)}
            </p>
          </div>
          <TextLink href={`/learning-paths/${membership.learningPath.id}`}>View</TextLink>
        </li>
      ))}
    </ul>
  );
}

function RecentActivity({ lessons, attempts }: { lessons: LessonProgress[]; attempts: QuizAttemptSummary[] }) {
  const activities = useMemo(() => {
    const lessonItems = lessons.map((lesson) => ({
      id: `lesson-${lesson.lessonId}`,
      title: lesson.lessonTitle,
      label: lesson.completed ? "Lesson completed" : "Lesson viewed",
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
            ? "Quiz passed"
            : "Quiz submitted"
          : "Quiz in progress",
      date: attempt.submittedAt ?? attempt.startedAt,
      href: `/quizzes/${attempt.quizId}`,
      tone: attempt.passed ? "success" as const : "neutral" as const,
    }));
    return [...lessonItems, ...quizItems]
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 6);
  }, [attempts, lessons]);

  if (!activities.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Start a lesson or quiz and your latest work will appear here."
        href="/learning-paths"
        action="Start learning"
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
                  {formatDate(activity.date)}
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
  const stats = [
    { label: "Paths joined", value: data.issues.includes("paths") ? "—" : data.paths.totalElements },
    { label: "Lessons started", value: data.issues.includes("lessons") ? "—" : data.lessonProgress.totalElements },
    { label: "Quiz attempts", value: data.issues.includes("quizAttempts") ? "—" : data.quizAttempts.totalElements },
  ];

  return (
    <DashboardSection
      eyebrow="At a glance"
      title="Learning statistics"
      description="Simple totals supported directly by your learning history."
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
  return (
    <div className="rounded-lg border border-danger/20 bg-danger-subtle p-5">
      <p className="text-sm font-medium text-danger-strong">{message}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>
    </div>
  );
}

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 text-sm font-semibold text-white shadow-button transition-[background-color,border-color,transform] hover:border-primary-hover hover:bg-primary-hover active:translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
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
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse space-y-10 motion-reduce:animate-none" role="status">
      <span className="sr-only">Loading dashboard</span>
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
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-64 rounded-lg border border-border bg-surface" />
        <div className="h-64 rounded-lg border border-border bg-surface" />
      </div>
    </div>
  );
}

function selectContinueLesson(data: DashboardData): ContinueLesson | null {
  const latest = data.lessonProgress.content[0];
  const pathLessons = [...(data.latestPathProgress?.lessons ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  if (latest && !latest.completed) return fromLessonProgress(latest, pathLessons);

  const nextPathLesson = pathLessons.find((lesson) => !lesson.completed);
  if (nextPathLesson) return fromPathLesson(nextPathLesson, pathLessons);

  return latest ? fromLessonProgress(latest, pathLessons) : null;
}

function fromLessonProgress(lesson: LessonProgress, pathLessons: LearningPathLessonProgress[]): ContinueLesson {
  const pathIndex = pathLessons.findIndex((item) => item.lessonId === lesson.lessonId);
  return {
    id: lesson.lessonId,
    title: lesson.lessonTitle,
    completed: lesson.completed,
    position: pathIndex >= 0 ? pathIndex + 1 : undefined,
    total: pathIndex >= 0 ? pathLessons.length : undefined,
    context: lesson.completed
      ? `Completed lesson · Last viewed ${formatDate(lesson.lastViewedAt)}`
      : `Last viewed ${formatDate(lesson.lastViewedAt)} · ${lesson.maxScrollPercent}% maximum scroll`,
  };
}

function fromPathLesson(lesson: LearningPathLessonProgress, pathLessons: LearningPathLessonProgress[]): ContinueLesson {
  return {
    id: lesson.lessonId,
    title: lesson.lessonTitle,
    completed: lesson.completed,
    position: pathLessons.findIndex((item) => item.lessonId === lesson.lessonId) + 1,
    total: pathLessons.length,
    context: lesson.required ? "Next required lesson in your latest joined path" : "Next lesson in your latest joined path",
  };
}

function hasAnyIssue(data: DashboardData, sections: DashboardSectionKey[]) {
  return sections.some((section) => data.issues.includes(section));
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}
