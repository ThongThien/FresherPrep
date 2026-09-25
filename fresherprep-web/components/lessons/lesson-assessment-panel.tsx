"use client";

import { useEffect, useRef, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { QuizAttempt } from "@/lib/quizzes/types";

export function LessonAssessmentPanel({ quizId, onCompleted }: { quizId: string; onCompleted: () => Promise<void> }) {
  const { t } = useI18n();
  const [attempt, setAttempt] = useState<QuizAttempt>();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  const answered = attempt?.questions.filter((item) => answers[item.id]).length ?? 0;

  useEffect(() => {
    if (!attempt || attempt.status !== "IN_PROGRESS") return;
    sessionStorage.setItem(storageKey(attempt.id), JSON.stringify(answers));
  }, [answers, attempt]);

  async function start() {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/quizzes/" + encodeURIComponent(quizId), { method: "POST" });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const value = await response.json() as QuizAttempt;
      setAttempt(value);
      setCurrent(0);
      try { setAnswers(JSON.parse(sessionStorage.getItem(storageKey(value.id)) ?? "{}") as Record<string, string>); }
      catch { setAnswers({}); }
    } catch (reason) { setError(messageOf(reason)); }
    finally { setPending(false); }
  }

  async function submit() {
    if (!attempt || submitting.current || attempt.status !== "IN_PROGRESS") return;
    submitting.current = true;
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/quiz-attempts/" + attempt.id + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: attempt.questions.flatMap((question) => answers[question.id] ? [{ attemptQuestionId: question.id, optionId: answers[question.id] }] : []) }),
      });
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const result = await response.json() as QuizAttempt;
      sessionStorage.removeItem(storageKey(attempt.id));
      setAttempt(result);
      await onCompleted();
    } catch (reason) { setError(messageOf(reason)); }
    finally { submitting.current = false; setPending(false); }
  }

  if (!attempt) return <section className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="lesson-assessment-title"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="lesson-assessment-title" className="text-xl font-semibold text-text">{t("Lesson assessment")}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{t("Answer each question in order. You need 80% to complete this lesson.")}</p></div><Button loading={pending} onClick={() => void start()}>{t("Start assessment")}</Button></div>{error ? <Feedback className="mt-4" tone="error" title={t("Assessment unavailable")}>{error}</Feedback> : null}</section>;

  if (attempt.status === "SUBMITTED") {
    const correct = attempt.questions.filter((question) => question.answerCorrect).length;
    return <section className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="assessment-result-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="assessment-result-title" className="text-xl font-semibold text-text">{t("Assessment result")}</h2><p className="mt-2 text-sm text-text-muted">{t("{{correct}} / {{total}} correct", { correct, total: attempt.questions.length })} � {attempt.scorePercentage}%</p></div><Badge variant={attempt.passed ? "success" : "danger"}>{t(attempt.passed ? "Passed" : "Not passed")}</Badge></div>{attempt.questions.some((question) => question.options.some((option) => option.explanation)) ? <div className="mt-5 space-y-3">{attempt.questions.map((question, index) => <details key={question.id} className="rounded-md border border-border px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-text">{t("Question {{number}}", { number: index + 1 })}  {t(question.answerCorrect ? "Correct" : "Incorrect")}</summary><p className="mt-2 text-sm text-text-muted">{question.options.find((option) => option.explanation)?.explanation}</p></details>)}</div> : null}<div className="mt-5">{attempt.passed ? <Feedback tone="success" title={t("Lesson completed")}>{t("Your assessment result has been saved.")}</Feedback> : <><Feedback tone="error" title={t("Review and try again")}>{t("This lesson remains incomplete until you pass the assessment.")}</Feedback><Button className="mt-4" variant="secondary" loading={pending} onClick={() => { setAttempt(undefined); setAnswers({}); }}>{t("Retry assessment")}</Button></>}</div></section>;
  }

  const question = attempt.questions[current];
  const isLast = current === attempt.questions.length - 1;
  return <section className="mt-8 rounded-lg border border-border bg-surface p-5 sm:p-6" aria-labelledby="lesson-assessment-title"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Lesson assessment")}</p><h2 id="lesson-assessment-title" className="mt-2 text-lg font-semibold text-text">{t("Question {{current}} / {{total}}", { current: current + 1, total: attempt.questions.length })}</h2></div><Badge>{t("{{answered}} answered", { answered })}</Badge></div><Progress className="mt-4" value={(current + 1) / attempt.questions.length * 100} label={t("Assessment progress")} />
    <fieldset className="mt-6 space-y-3" disabled={pending}><legend className="text-lg font-semibold leading-7 text-text">{question.content}</legend>{question.options.map((option) => <label key={option.id} className={(answers[question.id] === option.id ? "border-primary bg-primary-subtle" : "border-border hover:border-primary/40") + " mt-3 flex min-h-14 cursor-pointer items-start gap-3 rounded-md border p-4"}><input className="mt-1 size-4 accent-primary" type="radio" name={question.id} checked={answers[question.id] === option.id} onChange={() => setAnswers((value) => ({ ...value, [question.id]: option.id }))} /><span className="text-sm leading-6 text-text">{option.content}</span></label>)}</fieldset>
    {error ? <Feedback className="mt-4" tone="error" title={t("Request failed")}>{error}</Feedback> : null}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="secondary" disabled={pending || current === 0} onClick={() => setCurrent((value) => value - 1)}>{t("Previous")}</Button>{isLast ? <Button loading={pending} disabled={answered !== attempt.questions.length} onClick={() => void submit()}>{t("Submit assessment")}</Button> : <Button disabled={pending || !answers[question.id]} onClick={() => setCurrent((value) => value + 1)}>{t("Next")}</Button>}</div>
  </section>;
}

function storageKey(attemptId: string) { return "fresherprep-lesson-assessment-" + attemptId; }
function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "The assessment request failed."; }
