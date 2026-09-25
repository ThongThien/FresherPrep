"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge, Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { LessonDetailData, LessonProgress } from "@/lib/lessons/types";

import { LessonContent } from "./lesson-content";
import { LessonAssessmentPanel } from "./lesson-assessment-panel";
import { LessonRequirements } from "./lesson-requirements";

export function LessonPage({ lessonId, pathId }: { lessonId: string; pathId?: string }) {
  const { t } = useI18n();
  const [data, setData] = useState<LessonDetailData>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<LessonProgress>();
  const [syncError, setSyncError] = useState<string>();
  const [displayedActiveSeconds, setDisplayedActiveSeconds] = useState(0);
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
      setDisplayedActiveSeconds(value.activeSeconds);
      setSyncError(undefined);
    } catch {
      setSyncError(t("Reading progress could not be started. Try again while reading."));
    }
  }, [lessonId, t]);

  useEffect(() => {
    const controller = new AbortController();
    const query = pathId ? "?pathId=" + encodeURIComponent(pathId) : "";
    void fetch("/api/lessons/" + encodeURIComponent(lessonId) + query, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=" + encodeURIComponent("/lessons/" + lessonId));
        if (response.status === 404) return setError("NOT_FOUND");
        if (response.status === 409) return setError("LOCKED:" + (await readApiError(response)).message);
        if (!response.ok) return setError((await readApiError(response)).message);
        setData(await response.json() as LessonDetailData);
        void startProgress();
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(t("Unable to load this lesson. Check your connection and try again."));
      });
    return () => controller.abort();
  }, [lessonId, pathId, reload, startProgress, t]);

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
      setDisplayedActiveSeconds(value.activeSeconds + pendingSeconds.current);
      setSyncError(undefined);
    } catch (reason) {
      pendingSeconds.current += activeSeconds;
      setSyncError(reason instanceof Error ? reason.message : t("Progress is waiting to sync."));
    } finally { syncing.current = false; }
  }, [lessonId, recordElapsed, t]);

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
    const syncInterval = window.setInterval(() => void flush(), 20000);
    const timerInterval = window.setInterval(() => {
      recordElapsed();
      setDisplayedActiveSeconds((progressRef.current?.activeSeconds ?? 0) + pendingSeconds.current);
    }, 1000);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    return () => { recordElapsed(); void flush(); window.clearInterval(syncInterval); window.clearInterval(timerInterval); window.removeEventListener("scroll", scroll); document.removeEventListener("visibilitychange", visibility); };
  }, [flush, progress, recordElapsed]);

  if (error === "NOT_FOUND") return <div className="mx-auto max-w-2xl py-10"><h1 className="text-2xl font-semibold text-text">{t("Lesson not found")}</h1><p className="mt-3 text-text-muted">{t("This lesson may no longer be published.")}</p><Link className="mt-5 inline-flex text-sm font-semibold text-primary" href="/learning-paths">{t("Back to learning paths")}</Link></div>;
  if (error?.startsWith("LOCKED:")) return <div className="mx-auto max-w-2xl py-10"><Feedback tone="warning" title={t("Lesson locked")}>{error.slice("LOCKED:".length)}</Feedback><Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={pathId ? "/learning-paths/" + encodeURIComponent(pathId) : "/learning-paths"}>{t("Back to learning paths")}</Link></div>;
  if (error) return <div className="mx-auto max-w-2xl py-10"><Feedback tone="error" title={t("Lesson unavailable")}>{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setReload((value) => value + 1); }}>{t("Try again")}</Button></div>;
  if (!data) return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">{t("Loading lesson")}</span><div className="h-4 w-48 rounded bg-surface-strong" /><div className="mt-8 h-10 w-2/3 rounded bg-surface-strong" /></div>;

  const { lesson, pathContext } = data;
  const lessonHref = (id: string) => "/lessons/" + id + (pathContext ? "?pathId=" + encodeURIComponent(pathContext.id) : "");
  return <div className="mx-auto w-full max-w-6xl">
    <nav aria-label={t("Breadcrumb")} className="flex min-h-10 flex-wrap items-center gap-2 text-sm"><Link className="font-semibold text-primary" href="/learning-paths">{t("Learning Paths")}</Link>{pathContext ? <><span>/</span><Link className="font-semibold text-primary" href={"/learning-paths/" + pathContext.id}>{pathContext.name}</Link></> : null}<span>/</span><span className="text-text-muted">{lesson.title}</span></nav>
    <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,52rem)_17rem] lg:justify-between">
      <main className="min-w-0"><header className="border-b border-border pb-7"><div className="flex gap-2"><Badge variant="info">{t("Lesson")}</Badge>{progress?.completed ? <Badge variant="success">{t("Completed")}</Badge> : null}{progress?.readQualified && !progress.completed ? <Badge variant="success">{t("Reading qualified")}</Badge> : null}</div><h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{lesson.title}</h1></header>
      {lesson.prerequisites.length ? <section className="mt-6 border-l-4 border-primary/45 bg-primary-subtle px-5 py-4" aria-labelledby="lesson-prerequisites"><h2 id="lesson-prerequisites" className="text-sm font-semibold text-text">{t("Before this lesson")}</h2><ul className="mt-3 flex flex-wrap gap-4">{lesson.prerequisites.map((item) => <li key={item.id}><Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={lessonHref(item.id)}>{item.title}</Link></li>)}</ul></section> : null}
      <div className="mt-8"><LessonContent content={lesson.content} /></div>
      {progress?.assessmentRequired && progress.assessmentQuizId && progress.readQualified && !progress.completed ? <LessonAssessmentPanel quizId={progress.assessmentQuizId} passPercentage={progress.assessmentPassPercentage} onCompleted={startProgress} /> : null}
      <footer className="mt-12 border-t border-border pt-6"><h2 className="text-lg font-semibold text-text">{t("Next steps")}</h2>{progress?.completed ? <Feedback className="mt-4" tone="success" title={t("Lesson completed")}>{t("Your completion has been recorded. The next lesson is now available.")}</Feedback> : progress?.assessmentRequired ? <Feedback className="mt-4" tone="info" title={progress.readQualified ? t("Complete the assessment") : t("Finish the reading requirement")}>{progress.readQualified ? t("Pass the assessment to finish this lesson.") : t("Reach the required reading progress to unlock the assessment.")}</Feedback> : <p className="mt-2 text-sm text-text-muted">{t("Your progress is saved as you read.")}</p>}<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{pathContext?.previous ? <Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href={lessonHref(pathContext.previous.id)}>{t("Previous: {{title}}", { title: pathContext.previous.title })}</Link> : <span />}{progress?.completed && pathContext?.next ? <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 py-2 text-sm font-semibold text-white" href={lessonHref(pathContext.next.id)}>{t("Continue to next lesson: {{title}}", { title: pathContext.next.title })}</Link> : null}</div></footer></main>
      <aside className="space-y-5 lg:sticky lg:top-24"><LessonRequirements lesson={lesson} progress={progress} activeSeconds={displayedActiveSeconds} />{syncError ? <Feedback tone="warning" title={t("Progress needs attention")}><p>{syncError}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void (progressRef.current ? flush() : startProgress())}>{t("Retry sync")}</Button></Feedback> : null}</aside>
    </div>
  </div>;
}
