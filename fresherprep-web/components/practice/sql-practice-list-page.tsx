"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, CardContent, Feedback, LoadingState } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { PracticeExerciseSummary } from "@/lib/practice/types";

export function SqlPracticeListPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<PracticeExerciseSummary[]>();
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/practice/sql", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=%2Fpractice");
        if (!response.ok) throw new Error((await readApiError(response)).message);
        setItems(await response.json() as PracticeExerciseSummary[]);
        setError(undefined);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : t("Unable to load SQL exercises."));
        }
      });
    return () => controller.abort();
  }, [reload, t]);

  if (!items && !error) return <LoadingState title={t("Loading SQL exercises...")} description={t("Please wait a moment.")} />;
  if (!items) return <div className="mx-auto max-w-3xl"><Feedback tone="error" title={t("SQL Practice unavailable")}>{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => setReload((value) => value + 1)}>{t("Try again")}</Button></div>;

  return <div className="mx-auto w-full max-w-5xl">
    <header className="max-w-3xl">
      <p className="text-sm font-semibold text-primary">{t("Practice")}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">{t("SQL Practice")}</h1>
      <p className="mt-3 leading-7 text-text-muted">{t("Learn SQL step by step on an isolated dataset. Complete each exercise to unlock the next one.")}</p>
    </header>
    <ol className="mt-8 space-y-4">
      {items.map((item, index) => <li key={item.id}>
        <Card className={item.locked ? "bg-surface-muted opacity-75" : undefined}>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2"><Badge variant={item.completed ? "success" : item.locked ? "neutral" : "info"}>{t(item.completed ? "Completed" : item.locked ? "Locked" : item.difficulty)}</Badge><Badge>{item.concepts}</Badge></div>
              <h2 className="mt-2 font-semibold text-text">{item.title}</h2>
              <p className="mt-1 text-xs text-text-subtle">{item.code}</p>
            </div>
            {item.locked
              ? <span className="text-sm font-medium text-text-subtle">{t("Complete the previous exercise")}</span>
              : <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary-solid px-4 text-sm font-semibold text-white hover:bg-primary-solid-hover" href={`/practice/${item.id}`}>{t(item.completed ? "Practice again" : "Start exercise")}</Link>}
          </CardContent>
        </Card>
      </li>)}
    </ol>
  </div>;
}

