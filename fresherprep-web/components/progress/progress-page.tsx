"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { LessonProgress, QuizAttemptSummary } from "@/lib/dashboard/types";
import type { ProgressData } from "@/lib/progress/types";

export function LearningProgressPage() {
  const [data, setData] = useState<ProgressData>();
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/progress", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=%2Fprogress");
        if (!response.ok) return setError((await readApiError(response)).message);
        setData(await response.json() as ProgressData);
        setError(undefined);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load your learning progress.");
      });
    return () => controller.abort();
  }, [reload]);

  if (error && !data) return <div className="mx-auto max-w-3xl py-10"><Feedback tone="error" title="Progress unavailable">{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => setReload((value) => value + 1)}>Try again</Button></div>;
  if (!data) return <ProgressSkeleton />;

  const completedLessons = data.lessons.content.filter((lesson) => lesson.completed);
  const activeLessons = data.lessons.content.filter((lesson) => !lesson.completed);
  const submittedAttempts = data.quizAttempts.content.filter((attempt) => attempt.status === "SUBMITTED");

  return <div className="mx-auto w-full max-w-6xl">
    <header className="border-b border-border pb-7"><p className="text-sm font-semibold text-primary">Learning progress</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">Your learning record</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">A factual overview based on your joined paths, lesson activity, and quiz attempts.</p></header>

    <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Learning summary">
      <Summary label="Active paths" value={String(data.paths.totalElements)} />
      <Summary label="Completed lessons" value={String(completedLessons.length)} />
      <Summary label="Submitted quizzes" value={String(submittedAttempts.length)} />
    </section>

    <section className="mt-10" aria-labelledby="paths-title">
      <SectionHeading id="paths-title" title="Learning paths" description="Progress percentages are calculated by the backend from required lessons and weights." />
      {data.issues.includes("pathProgress") ? <Feedback className="mt-4" tone="warning" title="Some path progress is unavailable"><p>Available paths remain listed below.</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => setReload((value) => value + 1)}>Retry progress</Button></Feedback> : null}
      {!data.pathEntries.length ? <Empty title="No joined learning paths" message="Join a learning path to begin tracking structured progress." action="/learning-paths" /> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{data.pathEntries.map((entry) => <article className="rounded-lg border border-border bg-surface p-5 shadow-card" key={entry.membership.id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-text">{entry.membership.learningPath.name}</h3><p className="mt-1 text-xs text-text-muted">{entry.membership.learningPath.technologyName}</p></div>{entry.progress?.completed ? <Badge variant="success">Completed</Badge> : null}</div>{entry.progress ? <><Progress className="mt-5" value={entry.progress.progressPercentage} label="Required progress" showValue tone={entry.progress.completed ? "success" : "primary"} /><p className="mt-3 text-xs text-text-muted">{entry.progress.completedRequiredItems} of {entry.progress.requiredItems} required lessons completed</p></> : <p className="mt-5 text-sm text-warning-strong">Progress temporarily unavailable.</p>}<Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={"/learning-paths/" + entry.membership.learningPath.id}>View path</Link></article>)}</div>}
    </section>

    <section className="mt-10" aria-labelledby="lessons-title">
      <SectionHeading id="lessons-title" title="Lesson progress" description="Recent reading activity and backend-confirmed completion." />
      {data.issues.includes("lessons") ? <SectionError onRetry={() => setReload((value) => value + 1)} /> : !data.lessons.content.length ? <Empty title="No lesson activity" message="Open a lesson to start recording reading progress." action="/learning-paths" /> : <div className="mt-5 overflow-hidden rounded-lg border border-border bg-surface">{data.lessons.content.slice(0, 10).map((lesson) => <LessonRow key={lesson.lessonId} lesson={lesson} />)}</div>}
      {activeLessons.length || completedLessons.length ? <p className="mt-3 text-xs text-text-muted">{activeLessons.length} in progress · {completedLessons.length} completed</p> : null}
    </section>

    <section className="mt-10" id="quiz-activity" aria-labelledby="quiz-title">
      <SectionHeading id="quiz-title" title="Quiz activity" description="Recent attempts and server-calculated results." />
      {data.issues.includes("quizAttempts") ? <SectionError onRetry={() => setReload((value) => value + 1)} /> : !data.quizAttempts.content.length ? <Empty title="No quiz attempts" message="Quiz attempts will appear here after you begin an assessment." /> : <div className="mt-5 overflow-hidden rounded-lg border border-border bg-surface">{data.quizAttempts.content.slice(0, 10).map((attempt) => <AttemptRow key={attempt.id} attempt={attempt} />)}</div>}
    </section>
  </div>;
}

function LessonRow({ lesson }: { lesson: LessonProgress }) {
  return <div className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-text">{lesson.lessonTitle}</p><p className="mt-1 text-xs text-text-muted">Last viewed {formatDate(lesson.lastViewedAt)} · Scroll {lesson.maxScrollPercent}%</p></div><div className="flex items-center gap-3"><Badge variant={lesson.completed ? "success" : lesson.readQualified ? "info" : "neutral"}>{lesson.completed ? "Completed" : lesson.readQualified ? "Reading qualified" : "In progress"}</Badge><Link className="text-sm font-semibold text-primary" href={"/lessons/" + lesson.lessonId}>{lesson.completed ? "Review" : "Continue"}</Link></div></div>;
}

function AttemptRow({ attempt }: { attempt: QuizAttemptSummary }) {
  const submitted = attempt.status === "SUBMITTED";
  const href = submitted ? "/quizzes/" + attempt.quizId + "/attempts/" + attempt.id + "/result" : "/quizzes/" + attempt.quizId + "/attempts/" + attempt.id;
  return <div className="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-text">{attempt.quizTitle}</p><p className="mt-1 text-xs text-text-muted">{formatDate(attempt.submittedAt ?? attempt.startedAt)}</p></div><div className="flex flex-wrap items-center gap-3"><Badge variant={!submitted ? "info" : attempt.passed ? "success" : "danger"}>{!submitted ? "In progress" : attempt.passed ? "Passed" : "Not passed"}</Badge>{submitted && attempt.scorePercentage !== null ? <span className="text-sm font-semibold tabular-nums text-text">{formatScore(attempt.scorePercentage)}</span> : null}<Link className="text-sm font-semibold text-primary" href={href}>{submitted ? "View result" : "Resume"}</Link></div></div>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-surface p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-text">{value}</p></div>; }
function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) { return <div><h2 className="text-xl font-semibold text-text" id={id}>{title}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{description}</p></div>; }
function SectionError({ onRetry }: { onRetry: () => void }) { return <Feedback className="mt-4" tone="warning" title="Section unavailable"><p>This information could not be loaded. Other progress data is unaffected.</p><Button className="mt-3" size="sm" variant="secondary" onClick={onRetry}>Try again</Button></Feedback>; }
function Empty({ title, message, action }: { title: string; message: string; action?: string }) { return <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-8 text-center"><h3 className="font-semibold text-text">{title}</h3><p className="mt-2 text-sm text-text-muted">{message}</p>{action ? <Link className="mt-4 inline-flex text-sm font-semibold text-primary" href={action}>Browse learning paths</Link> : null}</div>; }
function ProgressSkeleton() { return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading learning progress</span><div className="h-10 w-2/3 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-28 rounded-lg bg-surface" key={item} />)}</div></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value)); }
function formatScore(value: number) { return Number(value).toFixed(1).replace(".0", "") + "%"; }
