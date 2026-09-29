"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, Feedback, Label, LoadingState, Textarea } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { PracticeExerciseDetail, SqlSubmitResult } from "@/lib/practice/types";

export function SqlPracticeExercisePage({ exerciseId }: { exerciseId: string }) {
  const { t } = useI18n();
  const [exercise, setExercise] = useState<PracticeExerciseDetail>();
  const [query, setQuery] = useState("SELECT ");
  const [result, setResult] = useState<SqlSubmitResult>();
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void fetch(`/api/practice/sql/${exerciseId}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace(`/login?next=${encodeURIComponent("/practice/" + exerciseId)}`);
        if (!response.ok) throw new Error((await readApiError(response)).message);
        setExercise(await response.json() as PracticeExerciseDetail);
        setError(undefined);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : t("Unable to load this SQL exercise."));
        }
      }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [exerciseId, reload, t]);

  async function submit() {
    if (submitting || !query.trim()) return;
    setSubmitting(true); setError(undefined); setResult(undefined);
    try {
      const response = await fetch(`/api/practice/sql/${exerciseId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (response.status === 401) return window.location.replace(`/login?next=${encodeURIComponent("/practice/" + exerciseId)}`);
      if (!response.ok) throw new Error((await readApiError(response)).message);
      const payload = await response.json() as SqlSubmitResult;
      setResult(payload);
      if (payload.correct) setExercise((current) => current ? { ...current, completed: true } : current);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to submit your query."));
    } finally { setSubmitting(false); }
  }

  if (loading) return <LoadingState title={t("Loading SQL exercise...")} description={t("Preparing the isolated dataset.")} />;
  if (!exercise) return <div className="mx-auto max-w-3xl"><Feedback tone="error" title={t("Exercise unavailable")}>{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => setReload((value) => value + 1)}>{t("Try again")}</Button></div>;

  return <div className="mx-auto w-full max-w-6xl">
    <Link className="text-sm font-semibold text-primary hover:underline" href="/practice">← {t("All SQL exercises")}</Link>
    <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
      <main>
        <div className="flex flex-wrap gap-2"><Badge variant={exercise.completed ? "success" : "info"}>{t(exercise.completed ? "Completed" : exercise.difficulty)}</Badge><Badge>{exercise.concepts}</Badge></div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text">{exercise.title}</h1>
        <p className="mt-4 leading-7 text-text-muted">{exercise.description}</p>
        <Card className="mt-6"><CardContent>
          <h2 className="font-semibold text-text">{t("Practice dataset schema")}</h2>
          <pre className="mt-3 overflow-x-auto rounded-md bg-code-background p-4 text-sm leading-6 text-code-text"><code>{exercise.schemaDescription}</code></pre>
        </CardContent></Card>
        <Button className="mt-4" variant="ghost" onClick={() => setShowHint((value) => !value)} aria-expanded={showHint}>? {t(showHint ? "Hide hint" : "Show hint")}</Button>
        {showHint ? <Feedback className="mt-3" title={t("Hint")}>{exercise.hint}</Feedback> : null}
      </main>
      <aside>
        <Card><CardContent>
          <Label htmlFor="sql-editor">{t("Your SQL query")}</Label>
          <Textarea id="sql-editor" className="min-h-64 font-mono text-sm leading-6" spellCheck={false} value={query} onChange={(event) => setQuery(event.target.value)} />
          <p className="mt-2 text-xs text-text-subtle">{t("Only one read-only SELECT statement is allowed. Timeout: 2 seconds.")}</p>
          <Button className="mt-4 w-full sm:w-auto" loading={submitting} onClick={() => void submit()}>{t("Run and submit")}</Button>
        </CardContent></Card>
        {error ? <Feedback className="mt-4" tone="error" title={t("Submission failed")}>{error}</Feedback> : null}
        {result ? <Feedback className="mt-4" tone={result.correct ? "success" : "warning"} title={t(result.correct ? "Correct answer" : "Not correct yet")}>
          <p>{t(result.message)}</p>
          {result.firstCompletion ? <p className="mt-1 font-semibold">{t("+{{points}} Learning Points", { points: result.awardedPoints })}</p> : null}
        </Feedback> : null}
        {result?.result ? <ResultTable columns={result.result.columns} rows={result.result.rows} /> : null}
        {result?.explanation ? <Card className="mt-4"><CardContent><h2 className="font-semibold text-text">{t("Explanation")}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{result.explanation}</p></CardContent></Card> : null}
      </aside>
    </div>
  </div>;
}

function ResultTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  const { t } = useI18n();
  return <Card className="mt-4"><CardContent>
    <h2 className="font-semibold text-text">{t("Query result")}</h2>
    <div className="mt-3 overflow-x-auto"><table className="w-full min-w-max border-collapse text-left text-sm">
      <thead><tr>{columns.map((column) => <th className="border border-border bg-surface-muted px-3 py-2 text-text" key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td className="border border-border px-3 py-2 text-text-muted" key={columnIndex}>{value}</td>)}</tr>)}</tbody>
    </table></div>
    {!rows.length ? <p className="mt-3 text-sm text-text-muted">{t("The query returned no rows.")}</p> : null}
  </CardContent></Card>;
}

