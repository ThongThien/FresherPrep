"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { AdminDashboardData, ContentStatus } from "@/lib/admin/types";

const quickActions = [
  ["Manage Knowledge", "/admin/knowledge", "Organize the curriculum hierarchy."],
  ["Manage Learning Paths", "/admin/learning-paths", "Curate ordered lesson programs."],
  ["Manage Lessons", "/admin/lessons", "Maintain learning content and prerequisites."],
  ["Manage Questions", "/admin/questions", "Maintain versioned assessment questions."],
  ["Manage Quizzes", "/admin/quizzes", "Configure fixed and rule-based quizzes."],
  ["Manage Users", "/admin/users", "Review the available user-management contract."],
] as const;

const statusLabels: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  REVIEW: "In review",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData>();
  const [error, setError] = useState<string>();
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) return window.location.replace("/login?next=%2Fadmin");
        if (response.status === 403) return window.location.replace("/dashboard");
        if (!response.ok) {
          setError((await readApiError(response)).message);
          return;
        }
        setData(await response.json() as AdminDashboardData);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError("Unable to load management data. Check your connection and try again.");
        }
      });
    return () => controller.abort();
  }, [requestKey]);

  if (!data && !error) return <DashboardSkeleton />;
  if (!data && error) return <div className="mx-auto max-w-3xl"><Feedback tone="error" title="Dashboard unavailable">{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setRequestKey((value) => value + 1); }}>Try again</Button></div>;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="border-b border-border pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text sm:text-4xl">Content overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">A concise view of the learning content currently managed by FresherPrep.</p>
      </header>

      {data?.unavailable.length ? <Feedback className="mt-6" tone="error" title="Some metrics are unavailable">{data.unavailable.join(", ")} could not be loaded. Other management data remains available.</Feedback> : null}

      <section className="mt-8" aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-lg font-semibold text-text">Content totals</h2>
        {data?.metrics.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{data.metrics.map((metric) => <Card key={metric.key}><CardContent><p className="text-sm font-medium text-text-muted">{metric.label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-text">{metric.total}</p></CardContent></Card>)}</div> : <p className="mt-4 text-sm text-text-muted">No content metrics are currently available.</p>}
      </section>

      {data?.statusTotals ? <section className="mt-10" aria-labelledby="status-title"><div><h2 id="status-title" className="text-lg font-semibold text-text">Publishing status</h2><p className="mt-1 text-sm text-text-muted">Across the fully loaded content collections above.</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(statusLabels) as ContentStatus[]).map((status) => <div key={status} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"><Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : "neutral"}>{statusLabels[status]}</Badge><span className="text-lg font-semibold text-text">{data.statusTotals?.[status]}</span></div>)}</div></section> : null}

      <section className="mt-10" aria-labelledby="actions-title">
        <h2 id="actions-title" className="text-lg font-semibold text-text">Management areas</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(([label, href, description]) => <Link key={href} href={href} className="group rounded-lg border border-border bg-surface p-5 shadow-card transition-colors hover:border-primary/30 focus-visible:ring-3 focus-visible:ring-focus/20"><span className="text-sm font-semibold text-text group-hover:text-primary">{label}</span><span className="mt-2 block text-sm leading-6 text-text-muted">{description}</span><span className="mt-4 inline-flex text-sm font-semibold text-primary">Open area</span></Link>)}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">Loading admin dashboard</span><div className="h-10 w-64 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 rounded-lg bg-surface" />)}</div></div>;
}
