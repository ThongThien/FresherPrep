"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge, Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { PublishedQuiz, QuizAttempt } from "@/lib/quizzes/types";

export function QuizStartPage({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<PublishedQuiz>();
  const [error, setError] = useState<string>();
  const [starting, setStarting] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/quizzes/" + encodeURIComponent(quizId), { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=" + encodeURIComponent("/quizzes/" + quizId));
        if (!response.ok) return setError(response.status === 404 ? "NOT_FOUND" : (await readApiError(response)).message);
        setQuiz(await response.json() as PublishedQuiz);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load this quiz.");
      });
    return () => controller.abort();
  }, [quizId, reload]);

  async function start() {
    if (starting) return;
    setStarting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/quizzes/" + encodeURIComponent(quizId), { method: "POST" });
      if (!response.ok) { setError((await readApiError(response)).message); return; }
      const attempt = await response.json() as QuizAttempt;
      router.push("/quizzes/" + quizId + "/attempts/" + attempt.id);
    } catch { setError("Unable to start the quiz. Check your connection and try again."); }
    finally { setStarting(false); }
  }

  if (error === "NOT_FOUND") return <State title="Quiz not found" message="This quiz may not exist or may no longer be published." />;
  if (!quiz && !error) return <div className="mx-auto max-w-3xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading quiz</span><div className="h-8 w-2/3 rounded bg-surface-strong" /><div className="mt-6 h-48 rounded-lg bg-surface" /></div>;
  if (!quiz) return <State title="Quiz unavailable" message={error ?? "Unable to load this quiz."} onRetry={() => { setError(undefined); setReload((value) => value + 1); }} />;

  return <div className="mx-auto max-w-3xl">
    <Link className="text-sm font-semibold text-primary" href="/learning-paths">Back to learning</Link>
    <header className="mt-6 border-b border-border pb-7">
      <div className="flex flex-wrap gap-2"><Badge variant="info">Technical assessment</Badge><Badge>{quiz.selectionMode === "FIXED" ? "Fixed questions" : "Rule-based questions"}</Badge></div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{quiz.title}</h1>
      <p className="mt-3 text-sm leading-6 text-text-muted">Answer each question once. Your choices are saved by the server and cannot be changed after submission.</p>
    </header>
    <section className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-card">
      <h2 className="font-semibold text-text">Before you begin</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-text-muted">
        <li>Questions and option order are provided by the assessment.</li>
        <li>You can safely reload after the attempt opens.</li>
        <li>No time limit is shown because the backend does not provide one.</li>
        <li>Passing threshold: {quiz.passPercentage}%.</li>
      </ul>
      {error ? <Feedback className="mt-5" tone="error" title="Unable to start">{error}</Feedback> : null}
      <Button className="mt-6 w-full sm:w-auto" size="lg" loading={starting} onClick={() => void start()}>{starting ? "Starting..." : "Start quiz"}</Button>
    </section>
  </div>;
}

function State({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return <div className="mx-auto max-w-2xl py-10"><h1 className="text-2xl font-semibold text-text">{title}</h1><p className="mt-3 text-sm text-text-muted">{message}</p><div className="mt-5 flex flex-wrap gap-3">{onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}<Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href="/learning-paths">Back to learning paths</Link></div></div>;
}
