"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { AttemptQuestion, QuizAttempt } from "@/lib/quizzes/types";

export function QuizResultPage({ quizId, attemptId }: { quizId: string; attemptId: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<QuizAttempt>();
  const [error, setError] = useState<string>();
  const [retrying, setRetrying] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/quiz-attempts/" + encodeURIComponent(attemptId), { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=" + encodeURIComponent("/quizzes/" + quizId + "/attempts/" + attemptId + "/result"));
        if (!response.ok) return setError(response.status === 404 ? "NOT_FOUND" : (await readApiError(response)).message);
        const value = await response.json() as QuizAttempt;
        if (value.quizId !== quizId) return setError("This result does not belong to the requested quiz.");
        if (value.status !== "SUBMITTED") return router.replace("/quizzes/" + quizId + "/attempts/" + attemptId);
        setAttempt(value);
        setError(undefined);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load this result.");
      });
    return () => controller.abort();
  }, [attemptId, quizId, reload, router]);

  async function retryQuiz() {
    if (retrying) return;
    setRetrying(true);
    setError(undefined);
    try {
      const response = await fetch("/api/quizzes/" + encodeURIComponent(quizId), { method: "POST" });
      if (!response.ok) return setError((await readApiError(response)).message);
      const next = await response.json() as QuizAttempt;
      router.push("/quizzes/" + quizId + "/attempts/" + next.id);
    } catch { setError("Unable to start another attempt."); }
    finally { setRetrying(false); }
  }

  if (error === "NOT_FOUND") return <ResultState title="Result not found" message="This attempt does not exist or is unavailable to your account." />;
  if (!attempt && error) return <ResultState title="Result unavailable" message={error} onRetry={() => setReload((value) => value + 1)} />;
  if (!attempt) return <ResultSkeleton />;

  const answered = attempt.questions.filter((question) => question.selectedOptionId).length;
  const score = attempt.scorePercentage ?? 0;
  return <div className="mx-auto w-full max-w-5xl">
    <header className="border-b border-border pb-8"><div className="flex flex-wrap items-center gap-2"><Badge variant={attempt.passed ? "success" : "danger"}>{attempt.passed ? "Passed" : "Not passed"}</Badge><Badge>Submitted</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{attempt.quizTitle}</h1><p className="mt-2 text-sm text-text-muted">Submitted {formatDate(attempt.submittedAt)}</p></header>
    <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Result summary"><Summary label="Score" value={formatScore(attempt.scorePercentage)} /><Summary label="Pass requirement" value={attempt.passPercentage + "%"} /><Summary label="Answered" value={answered + " / " + attempt.questions.length} /></section>
    <Progress className="mt-6" value={score} label="Final score" showValue tone={attempt.passed ? "success" : "primary"} />
    {error ? <Feedback className="mt-6" tone="error" title="Action failed">{error}</Feedback> : null}
    <div className="mt-7 flex flex-wrap gap-3"><Button loading={retrying} onClick={() => void retryQuiz()}>{retrying ? "Starting..." : "Try again"}</Button><LinkButton href="/learning-paths">Return to learning paths</LinkButton><LinkButton href="/progress#quiz-activity">View quiz history</LinkButton></div>
    <section className="mt-12" aria-labelledby="answer-review-title"><h2 id="answer-review-title" className="text-xl font-semibold text-text">Answer review</h2><div className="mt-5 space-y-5">{attempt.questions.map((question, index) => <QuestionReview key={question.id} index={index} question={question} />)}</div></section>
  </div>;
}

function QuestionReview({ question, index }: { question: AttemptQuestion; index: number }) {
  const selected = question.options.find((option) => option.id === question.selectedOptionId);
  const correct = question.options.find((option) => option.correct === true);
  const state = !selected ? "Unanswered" : question.answerCorrect ? "Correct" : "Incorrect";
  return <article className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-primary">Question {index + 1}</p><Badge variant={state === "Correct" ? "success" : state === "Incorrect" ? "danger" : "neutral"}>{state}</Badge></div>
    <h3 className="mt-3 font-semibold leading-7 text-text">{question.content}</h3>
    <dl className="mt-5 space-y-4 text-sm"><ReviewRow label="Your answer" value={selected?.content ?? "No answer submitted"} tone={state === "Correct" ? "success" : state === "Incorrect" ? "danger" : "neutral"} /><ReviewRow label="Correct answer" value={correct?.content ?? "Not provided"} tone="success" /></dl>
    {(selected?.explanation || correct?.explanation) ? <div className="mt-5 border-l-3 border-primary bg-primary-subtle px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary-strong">Explanation</p><p className="mt-1 text-sm leading-6 text-text-muted">{selected?.explanation ?? correct?.explanation}</p></div> : null}
  </article>;
}

function ReviewRow({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" }) {
  const classes = tone === "success" ? "text-success-strong" : tone === "danger" ? "text-danger-strong" : "text-text-muted";
  return <div><dt className="font-semibold text-text">{label}</dt><dd className={"mt-1 leading-6 " + classes}>{value}</dd></div>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-surface p-5"><p className="text-sm text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-text">{value}</p></div>; }
function LinkButton({ href, children }: { href: string; children: ReactNode }) { return <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border-strong px-4 text-sm font-semibold text-text hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20" href={href}>{children}</Link>; }
function ResultState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) { return <div className="mx-auto max-w-2xl py-10"><Feedback tone="error" title={title}>{message}</Feedback>{onRetry ? <Button className="mt-4" variant="secondary" onClick={onRetry}>Try again</Button> : null}</div>; }
function ResultSkeleton() { return <div className="mx-auto max-w-5xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading quiz result</span><div className="h-10 w-2/3 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div className="h-28 rounded-lg bg-surface" key={item} />)}</div></div>; }
function formatScore(score: number | null) { return score === null ? "Pending" : Number(score).toFixed(1).replace(".0", "") + "%"; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "recently"; }
