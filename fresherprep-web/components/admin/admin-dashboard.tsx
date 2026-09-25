"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { AdminDashboardData, ContentStatus } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

import { AdminPageHeader, AdminStatCard } from "./admin-ui";

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
  const { t } = useI18n();
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
          setError(t("Unable to load management data. Check your connection and try again."));
        }
      });
    return () => controller.abort();
  }, [requestKey, t]);

  if (!data && !error) return <DashboardSkeleton />;
  if (!data && error) return <div className="mx-auto max-w-3xl"><Feedback tone="error" title={t("Dashboard unavailable")}>{error}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setError(undefined); setRequestKey((value) => value + 1); }}>{t("Try again")}</Button></div>;

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title={t("Content overview")}
        description={t("A concise view of the learning content currently managed by FresherPrep.")}
      />

      {data?.unavailable.length ? <Feedback className="mt-6" tone="error" title={t("Some metrics are unavailable")}>{t("{{items}} could not be loaded. Other management data remains available.", { items: data.unavailable.join(", ") })}</Feedback> : null}

      <section className="mt-8" aria-labelledby="summary-title">
        <h2 id="summary-title" className="text-lg font-semibold text-text">{t("Content totals")}</h2>
        {data?.metrics.length ? <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{data.metrics.map((metric) => <AdminStatCard key={metric.key} label={t(metric.label)} value={metric.total} />)}</div> : <p className="mt-4 text-sm text-text-muted">{t("No content metrics are currently available.")}</p>}
      </section>

      {data?.statusTotals ? <section className="mt-10" aria-labelledby="status-title"><div><h2 id="status-title" className="text-lg font-semibold text-text">{t("Publishing status")}</h2><p className="mt-1 text-sm text-text-muted">{t("Across the fully loaded content collections above.")}</p></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(Object.keys(statusLabels) as ContentStatus[]).map((status) => <div key={status} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"><Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : "neutral"}>{t(statusLabels[status])}</Badge><span className="text-lg font-semibold text-text">{data.statusTotals?.[status]}</span></div>)}</div></section> : null}

      <section className="mt-10" aria-labelledby="actions-title">
        <h2 id="actions-title" className="text-lg font-semibold text-text">{t("Management areas")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map(([label, href, description]) => <Link key={href} href={href} className="group rounded-lg border border-border bg-surface p-5 shadow-card transition-colors hover:border-primary/30 focus-visible:ring-3 focus-visible:ring-focus/20"><span className="text-sm font-semibold text-text group-hover:text-primary">{t(label)}</span><span className="mt-2 block text-sm leading-6 text-text-muted">{t(description)}</span><span className="mt-4 inline-flex text-sm font-semibold text-primary">{t("Open area")}</span></Link>)}
        </div>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  const { t } = useI18n();
  return <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none" role="status"><span className="sr-only">{t("Loading admin dashboard")}</span><div className="h-10 w-64 rounded bg-surface-strong" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 rounded-lg bg-surface" />)}</div></div>;
}
