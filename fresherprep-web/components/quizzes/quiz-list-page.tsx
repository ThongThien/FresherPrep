"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { PageResponse } from "@/lib/dashboard/types";
import type { PublishedQuiz } from "@/lib/quizzes/types";

export function QuizListPage() {
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<PageResponse<PublishedQuiz>>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/quizzes?page=" + page, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=%2Fquizzes");
        if (!response.ok) return setError((await readApiError(response)).message);
        setData(await response.json() as PageResponse<PublishedQuiz>);
        setError(undefined);
      }).catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError("Unable to load available quizzes.");
      });
    return () => controller.abort();
  }, [page, reload]);

  if (error && !data) return <div className="mx-auto max-w-3xl py-10"><Feedback tone="error" title="Quizzes unavailable">{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setReload((value) => value + 1); }}>Try again</Button></div>;
  if (!data) return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading quizzes</span><div className="h-9 w-60 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="h-40 rounded-lg bg-surface" /><div className="h-40 rounded-lg bg-surface" /></div></div>;

  return <div className="mx-auto w-full max-w-6xl">
    <header className="max-w-3xl"><p className="text-sm font-semibold text-primary">Assessments</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">Quizzes</h1><p className="mt-3 text-sm leading-6 text-text-muted">Choose a published technical assessment. Questions are created by the backend when you start an attempt.</p></header>
    {error ? <Feedback className="mt-6" tone="warning" title="Unable to refresh">{error}</Feedback> : null}
    {!data.content.length ? <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center"><h2 className="font-semibold text-text">No published quizzes</h2><p className="mt-2 text-sm text-text-muted">Available assessments will appear here.</p><Link className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary" href="/learning-paths">Continue learning</Link></div> : <ul className="mt-8 grid gap-4 md:grid-cols-2">{data.content.map((quiz) => <li className="rounded-lg border border-border bg-surface p-5 shadow-card" key={quiz.id}><div className="flex flex-wrap gap-2"><Badge variant="info">{quiz.type}</Badge><Badge>{quiz.selectionMode === "FIXED" ? "Fixed" : "Rule-based"}</Badge></div><h2 className="mt-4 text-lg font-semibold text-text">{quiz.title}</h2><p className="mt-2 text-sm text-text-muted">Pass requirement: {quiz.passPercentage}%</p><Link className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-4 text-sm font-semibold text-white hover:bg-primary-solid-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25" href={"/quizzes/" + quiz.id}>View quiz</Link></li>)}</ul>}
    {data.totalPages > 1 ? <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Quiz pages"><Button variant="secondary" disabled={data.first} onClick={() => { setData(undefined); setPage((value) => value - 1); }}>Previous</Button><span className="text-sm tabular-nums text-text-muted">Page {data.number + 1} of {data.totalPages}</span><Button variant="secondary" disabled={data.last} onClick={() => { setData(undefined); setPage((value) => value + 1); }}>Next</Button></nav> : null}
  </div>;
}
