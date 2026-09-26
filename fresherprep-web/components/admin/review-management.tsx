"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, Label, Textarea } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type {
  AdminPage,
  ContributionContentType,
  ContributionDetail,
  ContributionSummary,
  ReviewStatus,
} from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";
import { ContributionContentSummary } from "@/components/contribution/contribution-content-summary";
import {
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminFilter,
  AdminLoadingState,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminToolbar,
  type AdminTableColumn,
} from "./admin-ui";

export function ReviewManagement() {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<ContributionSummary[]>([]);
  const [detail, setDetail] = useState<ContributionDetail>();
  const [type, setType] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("PENDING_REVIEW");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const params = new URLSearchParams({ page: String(page), size: "20", status });
    if (type) params.set("type", type);
    if (search.trim()) params.set("contributor", search.trim());
    try {
      const result = await adminRequest<AdminPage<ContributionSummary>>(`reviews?${params}`);
      setItems(result.content);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function open(id: string) {
    setError(undefined);
    setSuccess(undefined);
    try {
      setDetail(await adminRequest<ContributionDetail>(`reviews/${id}`));
      setReason("");
    } catch (cause) {
      setError(messageOf(cause));
    }
  }

  async function review(action: "approve" | "reject") {
    if (!detail || pending) return;
    if (action === "reject" && !reason.trim()) {
      setError(t("A rejection reason is required."));
      return;
    }
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const updated = await adminRequest<ContributionDetail>(
        `reviews/${detail.submission.id}/${action}`,
        { method: "POST", ...(action === "reject" ? jsonBody({ reason: reason.trim() }) : {}) },
      );
      setDetail(updated);
      setReason("");
      setSuccess(t(action === "approve" ? "Content published." : "Content returned to contributor."));
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setPending(false);
    }
  }

  const date = useMemo(() => new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ), [locale]);
  const columns: readonly AdminTableColumn<ContributionSummary>[] = [
    { key: "content", header: t("Content"), cell: (item) => <div><p className="font-semibold text-text">{item.title}</p><p className="mt-1 text-xs">{t(item.contentType)}</p></div> },
    { key: "contributor", header: t("Contributor"), cell: (item) => <div><p>{item.contributorName}</p><p className="mt-1 text-xs">{item.contributorEmail}</p></div> },
    { key: "status", header: t("Status"), cell: (item) => <ReviewBadge status={item.status} /> },
    { key: "submitted", header: t("Submitted"), cell: (item) => item.submittedAt ? date.format(new Date(item.submittedAt)) : "—" },
    { key: "actions", header: t("Actions"), className: "text-right", cell: (item) => <Button size="sm" variant="ghost" onClick={() => void open(item.id)}>{t("Review")}</Button> },
  ];

  return <div className="mx-auto max-w-7xl">
    <AdminPageHeader
      title={t("Content reviews")}
      description={t("Review contributor drafts before they become official learning content.")}
      breadcrumbs={[{ label: "Overview", href: "/admin" }, { label: "Reviews" }]}
    />
    {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
    {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}
    <section className="mt-7">
      <AdminToolbar>
        <AdminSearch value={search} onChange={(value) => { setSearch(value); setPage(0); }} label={t("Search contributor")} />
        <AdminFilter label={t("Filter by content type")} value={type} onChange={(value) => { setType(value); setPage(0); }}>
          <option value="">{t("All content types")}</option>
          {(["LESSON", "QUESTION", "QUIZ"] satisfies ContributionContentType[]).map((value) => <option key={value} value={value}>{t(value)}</option>)}
        </AdminFilter>
        <AdminFilter label={t("Filter by review status")} value={status} onChange={(value) => { setStatus(value as ReviewStatus); setPage(0); }}>
          {(["PENDING_REVIEW", "REJECTED", "PUBLISHED", "DRAFT"] satisfies ReviewStatus[]).map((value) => <option key={value} value={value}>{t(value)}</option>)}
        </AdminFilter>
      </AdminToolbar>
      <div className="mt-5">
        {loading ? <AdminLoadingState label={t("Loading reviews...")} /> : error && !items.length ? <AdminErrorState title={t("Unable to load reviews")} message={error} onRetry={() => void load()} /> : items.length ? <>
          <AdminDataTable columns={columns} rows={items} rowKey={(item) => item.id} caption={t("Content review queue")} />
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </> : <AdminEmptyState title={t("No submissions in this review state.")} />}
      </div>
    </section>
    {detail ? <section className="mt-8 border-t border-border pt-7" aria-labelledby="review-detail-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-semibold text-text" id="review-detail-title">{detail.submission.title}</h2><p className="mt-1 text-sm text-text-muted">{t(detail.submission.contentType)} / {detail.submission.contributorName}</p></div>
        <Button variant="ghost" onClick={() => setDetail(undefined)}>{t("Close details")}</Button>
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Card><CardContent>
          <h3 className="font-semibold text-text">{t("Submitted content")}</h3>
          <ContributionContentSummary type={detail.submission.contentType} content={detail.content} />
        </CardContent></Card>
        <div className="space-y-5">
          <Card><CardContent>
            <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-text">{t("Review status")}</h3><ReviewBadge status={detail.submission.status} /></div>
            {detail.submission.status === "REJECTED" && detail.submission.reviewComment ? <Feedback className="mt-4" tone="error" title={t("Rejection reason")}>{detail.submission.reviewComment}</Feedback> : null}
            {detail.submission.status === "PENDING_REVIEW" ? <div className="mt-5 space-y-4">
              <Button className="w-full" loading={pending} onClick={() => void review("approve")}>{t("Approve and publish")}</Button>
              <div><Label htmlFor="reject-reason">{t("Rejection reason")}</Label><Textarea id="reject-reason" className="mt-2" value={reason} onChange={(event) => setReason(event.target.value)} /></div>
              <Button className="w-full" variant="danger" disabled={!reason.trim()} loading={pending} onClick={() => void review("reject")}>{t("Reject")}</Button>
            </div> : null}
          </CardContent></Card>
          <Card><CardContent><h3 className="font-semibold text-text">{t("Review history")}</h3><ol className="mt-4 space-y-4">{detail.history.map((event) => <li className="border-l-2 border-border pl-3 text-sm" key={event.id}><p className="font-medium text-text">{t(event.action)}</p><p className="mt-1 text-xs text-text-muted">{event.actorName} / {date.format(new Date(event.occurredAt))}</p>{event.comment ? <p className="mt-2 text-text-muted">{event.comment}</p> : null}</li>)}</ol></CardContent></Card>
        </div>
      </div>
    </section> : null}
  </div>;
}

function ReviewBadge({ status }: { status: ReviewStatus }) {
  const { t } = useI18n();
  const variant = status === "PUBLISHED" ? "success" : status === "REJECTED" ? "danger" : status === "PENDING_REVIEW" ? "warning" : "neutral";
  return <Badge variant={variant}>{t(status)}</Badge>;
}

function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : "The request could not be completed.";
}
