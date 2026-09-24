"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { LessonDetailData, LessonProgress } from "@/lib/lessons/types";

import { LessonContent } from "./lesson-content";

export function LessonPage({ lessonId, pathId }: { lessonId: string; pathId?: string }) {
  const [data, setData] = useState<LessonDetailData>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<LessonProgress>();
  const [syncError, setSyncError] = useState<string>();
  const [reload, setReload] = useState(0);
  const progressRef = useRef<LessonProgress | undefined>(undefined);
  const pendingSeconds = useRef(0);
  const maxScroll = useRef(0);
  const viewedAt = useRef<number | undefined>(undefined);
  const syncing = useRef(false);

  const startProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/lessons/" + encodeURIComponent(lessonId) + "/start", { method: "POST" });
      if (response.status === 401) {
        window.location.replace("/login?next=" + encodeURIComponent("/lessons/" + lessonId));
        return;
      }
      if (!response.ok) {
        setSyncError((await readApiError(response)).message);
        return;
      }
      const value = await response.json() as LessonProgress;
      progressRef.current = value;
      maxScroll.current = value.maxScrollPercent;
      setProgress(value);
      setSyncError(undefined);
    } catch {
      setSyncError("Reading progress could not be started. Try again while reading.");
    }
  }, [lessonId]);

  useEffect(() => {
    const controller = new AbortController();
    const query = pathId ? "?pathId=" + encodeURIComponent(pathId) : "";
    void fetch("/api/lessons/" + encodeURIComponent(lessonId) + query, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=" + encodeURIComponent("/lessons/" + lessonId));
        if (response.status === 404) return setError("NOT_FOUND");
        if (!response.ok) return setError((await readApiError(response)).message);
        setData(await response.json() as LessonDetailData);
        void startProgress();
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load this lesson. Check your connection and try again.");
      });
    return () => controller.abort();
  }, [lessonId, pathId, reload, startProgress]);

  const recordElapsed = useCallback(() => {
    if (document.visibilityState !== "visible" || viewedAt.current === undefined) return;
    const seconds = Math.floor((Date.now() - viewedAt.current) / 1000);
    if (seconds > 0) { pendingSeconds.current += seconds; viewedAt.current += seconds * 1000; }
  }, []);

  const flush = useCallback(async () => {
    recordElapsed();
    const current = progressRef.current;
    if (!current || syncing.current || (pendingSeconds.current === 0 && maxScroll.current <= current.maxScrollPercent)) return;
    const activeSeconds = pendingSeconds.current;
    pendingSeconds.current = 0;
    syncing.current = true;
    try {
      const response = await fetch("/api/lessons/" + encodeURIComponent(lessonId) + "/progress", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeSeconds, scrollPercent: maxScroll.current }), keepalive: true,
      });
      if (response.status === 401) {
        window.location.replace("/login?next=" + encodeURIComponent("/lessons/" + lessonId));
        return;
      }
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const value = await response.json() as LessonProgress;
      progressRef.current = value;
      maxScroll.current = Math.max(maxScroll.current, value.maxScrollPercent);
      setProgress(value);
      setSyncError(undefined);
    } catch (reason) {
      pendingSeconds.current += activeSeconds;
      setSyncError(reason instanceof Error ? reason.message : "Progress is waiting to sync.");
    } finally { syncing.current = false; }
  }, [lessonId, recordElapsed]);

  useEffect(() => {
    if (!progress) return;
    viewedAt.current = document.visibilityState === "visible" ? Date.now() : undefined;
    const scroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      maxScroll.current = Math.max(maxScroll.current, height <= 0 ? 100 : Math.round(window.scrollY / height * 100));
    };
    const visibility = () => {
      if (document.visibilityState === "visible") viewedAt.current = Date.now();
      else { recordElapsed(); void flush(); viewedAt.current = undefined; }
    };
    const interval = window.setInterval(() => void flush(), 20000);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => { recordElapsed(); void flush(); window.clearInterval(interval); window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", visibility); };
  }, [flush, progress, recordElapsed]);

  if (error === "NOT_FOUND") return <div className="mx-auto max-w-2xl py-10"><h1 className="text-2xl font-semibold text-text">Lesson not found</h1><p className="mt-3 text-text-muted">This lesson may no longer be published.</p><Link className="mt-5 inline-flex text-sm font-semibold text-primary" href="/learning-paths">Back to learning paths</Link></div>;
  if (error) return <div className="mx-auto max-w-2xl py-10"><Feedback tone="error" title="Lesson unavailable">{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setReload((value) => value + 1); }}>Try again</Button></div>;
  if (!data) return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading lesson</span><div className="h-4 w-48 rounded bg-surface-strong" /><div className="mt-8 h-10 w-2/3 rounded bg-surface-strong" /></div>;

  const { lesson, pathContext } = data;
  const lessonHref = (id: string) => "/lessons/" + id + (pathContext ? "?pathId=" + encodeURIComponent(pathContext.id) : "");
  const time = progress ? Math.min(100, progress.activeSeconds / Math.max(1, lesson.minimumReadSeconds) * 100) : 0;
  const scroll = progress ? Math.min(100, progress.maxScrollPercent / Math.max(1, lesson.requiredScrollPercent) * 100) : 0;
  return <div className="mx-auto w-full max-w-6xl">
    <nav aria-label="Breadcrumb" className="flex min-h-10 flex-wrap items-center gap-2 text-sm"><Link className="font-semibold text-primary" href="/learning-paths">Learning Paths</Link>{pathContext ? <><span>/</span><Link className="font-semibold text-primary" href={"/learning-paths/" + pathContext.id}>{pathContext.name}</Link></> : null}<span>/</span><span className="text-text-muted">{lesson.title}</span></nav>
    <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,52rem)_17rem] lg:justify-between">
      <main className="min-w-0"><header className="border-b border-border pb-7"><div className="flex gap-2"><Badge variant="info">Lesson</Badge>{progress?.completed ? <Badge variant="success">Completed</Badge> : null}{progress?.readQualified && !progress.completed ? <Badge variant="success">Reading qualified</Badge> : null}</div><h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{lesson.title}</h1></header>
      {lesson.prerequisites.length ? <section className="mt-6 border-l-4 border-primary/45 bg-primary-subtle px-5 py-4" aria-labelledby="lesson-prerequisites"><h2 id="lesson-prerequisites" className="text-sm font-semibold text-text">Before this lesson</h2><ul className="mt-3 flex flex-wrap gap-4">{lesson.prerequisites.map((item) => <li key={item.id}><Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={lessonHref(item.id)}>{item.title}</Link></li>)}</ul></section> : null}
      <div className="mt-8"><LessonContent content={lesson.content} /></div>
      <footer className="mt-12 border-t border-border pt-6"><h2 className="text-lg font-semibold text-text">Next steps</h2>{progress?.completed ? <Feedback className="mt-4" tone="success" title="Lesson completed">Your completion has been recorded.</Feedback> : progress?.readQualified && progress.assessmentRequired ? <Feedback className="mt-4" tone="info" title="Reading requirement met">Complete the assessment to finish this lesson.</Feedback> : <p className="mt-2 text-sm text-text-muted">Your progress is saved as you read.</p>}<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{pathContext?.previous ? <Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={lessonHref(pathContext.previous.id)}>Previous: {pathContext.previous.title}</Link> : <span />}{progress?.assessmentRequired && progress.assessmentQuizId && progress.readQualified && !progress.completed ? <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary-solid px-4 py-2 text-sm font-semibold text-white" href={"/quizzes/" + progress.assessmentQuizId}>Go to assessment</Link> : pathContext?.next ? <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border-strong px-4 py-2 text-sm font-semibold text-text" href={lessonHref(pathContext.next.id)}>Next: {pathContext.next.title}</Link> : null}</div></footer></main>
      <aside className="space-y-5 lg:sticky lg:top-24"><section className="rounded-lg border border-border bg-surface p-5 shadow-card"><div className="flex justify-between"><h2 className="text-sm font-semibold text-text">Reading progress</h2>{progress?.readQualified ? <span className="text-sm font-semibold text-success-strong">Qualified</span> : null}</div><div className="mt-5 space-y-5"><Progress value={time} label="Active reading time" showValue /><p className="-mt-3 text-xs text-text-muted">{formatTime(progress?.activeSeconds ?? 0)} of {formatTime(lesson.minimumReadSeconds)} required</p><Progress value={scroll} label="Lesson explored" showValue /><p className="-mt-3 text-xs text-text-muted">{progress?.maxScrollPercent ?? 0}% of {lesson.requiredScrollPercent}% required</p></div>{progress?.assessmentRequired ? <p className="mt-5 border-t border-border pt-4 text-sm text-text-muted">Assessment: {progress.assessmentStatus.toLowerCase().replace("_", " ")}</p> : null}</section>{syncError ? <Feedback tone="warning" title="Progress needs attention"><p>{syncError}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void (progressRef.current ? flush() : startProgress())}>Retry sync</Button></Feedback> : null}</aside>
    </div>
  </div>;
}

function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); return minutes ? minutes + " min " + seconds % 60 + " sec" : seconds + " sec"; }
