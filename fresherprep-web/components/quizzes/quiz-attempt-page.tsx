"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, ConfirmDialog, Feedback, LoadingState, NavigationConfirm, Progress } from "@/components/ui";
import { useCurrentUser } from "@/components/auth";
import { readApiError } from "@/lib/api/client";
import type { QuizAttempt } from "@/lib/quizzes/types";
import { useI18n } from "@/lib/i18n";
import { clearProgressCache } from "@/lib/progress/cache";

export function QuizAttemptPage({ quizId, attemptId }: { quizId: string; attemptId: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const user = useCurrentUser();
  const [attempt, setAttempt] = useState<QuizAttempt>();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/quiz-attempts/" + encodeURIComponent(attemptId), { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=" + encodeURIComponent("/quizzes/" + quizId + "/attempts/" + attemptId));
        if (!response.ok) return setError(response.status === 404 ? "NOT_FOUND" : (await readApiError(response)).message);
        const value = await response.json() as QuizAttempt;
        if (value.quizId !== quizId) return setError(t("This attempt does not belong to the requested quiz."));
        if (value.status === "SUBMITTED") return router.replace("/quizzes/" + quizId + "/attempts/" + attemptId + "/result");
        setAttempt(value);
        setRemainingSeconds(value.expiresAt ? secondsUntil(value.expiresAt) : null);
        const serverAnswers = Object.fromEntries(
          value.questions
            .filter((item) => item.selectedOptionId)
            .map((item) => [item.id, item.selectedOptionId as string]),
        );
        const storageKey = "fresherprep-attempt-" + value.id;
        try {
          const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}") as Record<string, string>;
          setAnswers({ ...saved, ...serverAnswers });
        } catch { setAnswers(serverAnswers); }
        setError(undefined);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(t("Unable to restore this attempt."));
      });
    return () => controller.abort();
  }, [attemptId, quizId, reload, router, t]);

  const question = attempt?.questions[current];
  const answered = useMemo(
    () => attempt?.questions.filter((item) => Boolean(answers[item.id])).length ?? 0,
    [answers, attempt],
  );
  const selectedOptionId = question ? answers[question.id] : undefined;

  useEffect(() => {
    if (!attempt) return;
    sessionStorage.setItem("fresherprep-attempt-" + attempt.id, JSON.stringify(answers));
  }, [answers, attempt]);

  useEffect(() => {
    if (!attempt?.expiresAt) return;
    const update = () => setRemainingSeconds(secondsUntil(attempt.expiresAt as string));
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt?.expiresAt]);

  useEffect(() => {
    if (remainingSeconds === 0 && attempt && !submitInFlightRef.current) void submitAttempt();
  // submitAttempt intentionally uses the latest component state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  function goToQuestion(index: number) {
    setCurrent(index);
  }

  async function submitAttempt() {
    if (!attempt || submitInFlightRef.current || attempt.status !== "IN_PROGRESS") return;
    submitInFlightRef.current = true;
    setSubmitting(true);
    setError(undefined);
    try {
      const response = await fetch("/api/quiz-attempts/" + attempt.id + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: attempt.questions.flatMap((item) => {
            const optionId = answers[item.id];
            return optionId ? [{ attemptQuestionId: item.id, optionId }] : [];
          }),
        }),
      });
      if (!response.ok) { setError((await readApiError(response)).message); return; }
      const value = await response.json() as QuizAttempt;
      if (value.status !== "SUBMITTED") {
        setError(t("The attempt was not completed. You can safely try again."));
        return;
      }
      sessionStorage.removeItem("fresherprep-attempt-" + attempt.id);
      clearProgressCache(user.id);
      router.replace("/quizzes/" + quizId + "/attempts/" + attempt.id + "/result");
    } catch { setError(t("Unable to submit this attempt. You can safely try again.")); }
    finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (error === "NOT_FOUND") return <Message title={t("Attempt not found")} message={t("This attempt does not exist or is not available to your account.")} />;
  if (!attempt && error) return <Message title={t("Attempt unavailable")} message={error} retry={() => setReload((value) => value + 1)} />;
  if (!attempt || !question) return <LoadingState className="mx-auto max-w-3xl" title={t("Loading questions...")} description={t("Please wait a moment.")} />;

  const expired = remainingSeconds === 0;
  return <div className="mx-auto max-w-5xl">
    <NavigationConfirm
      enabled={attempt.status === "IN_PROGRESS" && !submitting}
      title={t("Leave this quiz?")}
      description={t("Your selected answers are kept only in this browser until you submit the quiz.")}
      confirmLabel={t("Leave quiz")}
      cancelLabel={t("Continue quiz")}
    />
    <header className="border-b border-border pb-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Assessment in progress")}</p><h1 className="mt-2 text-2xl font-semibold text-text">{attempt.quizTitle}</h1></div><div className="flex items-center gap-2">{remainingSeconds !== null ? <Badge variant={remainingSeconds <= 60 ? "warning" : "neutral"}>{t("Time remaining: {{time}}", { time: formatCountdown(remainingSeconds) })}</Badge> : null}<Badge>{t("{{answered}} of {{total}} answered", { answered, total: attempt.questions.length })}</Badge></div></div><Progress className="mt-5" value={answered / attempt.questions.length * 100} label={t("Answer progress")} showValue /></header>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
      <main className="rounded-lg border border-border bg-surface p-5 shadow-card sm:p-7" aria-labelledby="question-title">
        <p className="text-sm font-semibold text-primary">{t("Question {{current}} of {{total}}", { current: current + 1, total: attempt.questions.length })}</p>
        <h2 id="question-title" className="mt-3 text-xl font-semibold leading-8 text-text">{question.content}</h2>
        <fieldset className="mt-6 space-y-3" disabled={submitting || expired}>
          <legend className="sr-only">{t("Choose one answer")}</legend>
          {question.options.map((option) => {
            const checked = selectedOptionId === option.id;
            return <label key={option.id} className={"flex min-h-14 cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors focus-within:ring-3 focus-within:ring-focus/20 " + (checked ? "border-primary bg-primary-subtle" : "border-border hover:border-primary/40")}>
              <input className="mt-1 size-4 accent-primary" type="radio" name={"question-" + question.id} value={option.id} checked={checked} onChange={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option.id }))} />
              <span className="min-w-0 text-sm leading-6 text-text"><span className="mr-2 font-semibold">{option.position}.</span>{option.content}</span>
            </label>;
          })}
        </fieldset>
        {expired ? <Feedback className="mt-5" tone="warning" title={t("Time is up")}>{t("Your current answers are being submitted.")}</Feedback> : null}{error ? <Feedback className="mt-5" tone="error" title={t("Request failed")}>{error}</Feedback> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><Button className="w-full sm:w-auto" variant="secondary" disabled={current === 0 || submitting} onClick={() => goToQuestion(current - 1)}>{t("Previous")}</Button><Button className="w-full sm:w-auto" variant="secondary" disabled={current === attempt.questions.length - 1 || submitting} onClick={() => goToQuestion(current + 1)}>{t("Next")}</Button></div>
      </main>
      <aside className="space-y-5 lg:sticky lg:top-24"><section className="rounded-lg border border-border bg-surface p-4"><h2 className="text-sm font-semibold text-text">{t("Questions")}</h2><div className="mt-4 grid grid-cols-5 gap-2 lg:grid-cols-4">{attempt.questions.map((item, index) => { const itemAnswered = Boolean(answers[item.id]); return <button key={item.id} type="button" disabled={submitting} aria-label={t(itemAnswered ? "Question {{number}}, answered" : "Question {{number}}, unanswered", { number: index + 1 })} aria-current={index === current ? "step" : undefined} className={"min-h-10 rounded-md border text-sm font-semibold " + (index === current ? "border-primary-solid bg-primary-solid text-white" : itemAnswered ? "border-success/30 bg-success-subtle text-success-strong" : "border-border text-text-muted")} onClick={() => goToQuestion(index)}>{index + 1}<span className="sr-only">{t(itemAnswered ? "answered" : "unanswered")}</span></button>; })}</div><div className="mt-4 space-y-1 text-xs text-text-muted"><p>{t("Answered: {{count}}", { count: answered })}</p><p>{t("Unanswered: {{count}}", { count: attempt.questions.length - answered })}</p></div></section><Button className="w-full" variant="secondary" disabled={submitting} onClick={() => setConfirming(true)}>{t("Submit quiz")}</Button></aside>
    </div>
    <ConfirmDialog
      open={confirming}
      title={t("Submit this quiz?")}
      description={t("{{answered}} answered and {{unanswered}} unanswered. After submitting, answers can no longer be changed.", { answered, unanswered: attempt.questions.length - answered })}
      confirmLabel={submitting ? t("Submitting...") : t("Confirm submit")}
      cancelLabel={t("Cancel")}
      pending={submitting}
      onConfirm={() => void submitAttempt()}
      onClose={() => setConfirming(false)}
    />
  </div>;
}

function Message({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  const { t } = useI18n();
  return <div className="mx-auto max-w-2xl py-10"><h1 className="text-2xl font-semibold text-text">{title}</h1><p className="mt-3 text-sm text-text-muted">{message}</p><div className="mt-5 flex gap-3">{retry ? <Button variant="secondary" onClick={retry}>{t("Try again")}</Button> : null}<Link className="inline-flex min-h-10 items-center text-sm font-semibold text-primary" href="/learning-paths">{t("Back to learning")}</Link></div></div>;
}

function formatCountdown(seconds: number) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

function secondsUntil(expiresAt: string) {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000));
}
