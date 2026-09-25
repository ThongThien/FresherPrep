"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useCurrentUser } from "@/components/auth";
import { Badge, Button, Card, CardContent, Feedback } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type {
  AdminPage,
  AdminUserDetail,
  AdminUserSummary,
  UserRole,
} from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminFilter,
  AdminLoadingState,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminStatCard,
  AdminToolbar,
  type AdminTableColumn,
} from "./admin-ui";

type PendingChange =
  | { kind: "status"; user: AdminUserSummary; active: boolean }
  | { kind: "role"; user: AdminUserSummary; role: UserRole };

export function UserManagement() {
  const { locale, t } = useI18n();
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [detail, setDetail] = useState<AdminUserDetail>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [change, setChange] = useState<PendingChange>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    const params = new URLSearchParams({
      page: String(page),
      size: "20",
      sort: "createdAt,desc",
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role) params.set("role", role);
    if (status) params.set("active", String(status === "ACTIVE"));
    try {
      const result = await adminRequest<AdminPage<AdminUserSummary>>(`users?${params}`);
      setUsers(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, role, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  async function openDetail(userId: string) {
    setDetailLoading(true);
    setError(undefined);
    try {
      setDetail(await adminRequest<AdminUserDetail>(`users/${userId}`));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setDetailLoading(false);
    }
  }

  async function applyChange() {
    if (!change) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      if (change.kind === "status") {
        await adminRequest(`users/${change.user.id}/status`, {
          method: "PATCH",
          ...jsonBody({ active: change.active }),
        });
        setSuccess(t("User status updated."));
      } else {
        await adminRequest(`users/${change.user.id}/role`, {
          method: "PATCH",
          ...jsonBody({ role: change.role }),
        });
        setSuccess(t("User role updated."));
      }
      const selectedId = detail?.account.id;
      setChange(undefined);
      await loadUsers();
      if (selectedId) await openDetail(selectedId);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(
    locale === "vi" ? "vi-VN" : "en-US",
    { dateStyle: "medium", timeStyle: "short" },
  ), [locale]);

  const columns: readonly AdminTableColumn<AdminUserSummary>[] = [
    {
      key: "user",
      header: t("User"),
      cell: (user) => <div><p className="font-semibold text-text">{user.displayName}</p><p className="mt-1 text-xs">{user.email}</p></div>,
    },
    { key: "role", header: t("Role"), cell: (user) => <RoleBadge role={user.role} /> },
    { key: "status", header: t("Status"), cell: (user) => <StatusBadge active={user.active} /> },
    { key: "created", header: t("Created at"), cell: (user) => dateFormatter.format(new Date(user.createdAt)) },
    {
      key: "actions",
      header: t("Actions"),
      className: "text-right",
      cell: (user) => <Button size="sm" variant="ghost" onClick={() => void openDetail(user.id)}>{t("View details")}</Button>,
    },
  ];

  const noResults = Boolean(debouncedSearch || role || status);

  return (
    <div className="mx-auto max-w-7xl">
      <AdminPageHeader
        title={t("Users")}
        description={t("Review accounts, learning activity, roles, and access status.")}
        breadcrumbs={[{ label: "Overview", href: "/admin" }, { label: "Users" }]}
      />

      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label={t("User summary")}>
        <AdminStatCard label={t("Matching users")} value={totalElements} />
        <AdminStatCard label={t("Current role filter")} value={role || t("All roles")} />
        <AdminStatCard label={t("Current status filter")} value={status ? t(status) : t("All statuses")} />
      </section>

      <section className="mt-7" aria-label={t("User list")}>
        <AdminToolbar>
          <AdminSearch value={search} onChange={setSearch} label={t("Search users")} placeholder={t("Search name or email")} />
          <AdminFilter label={t("Filter by role")} value={role} onChange={(value) => { setRole(value); setPage(0); }}>
            <option value="">{t("All roles")}</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </AdminFilter>
          <AdminFilter label={t("Filter by status")} value={status} onChange={(value) => { setStatus(value); setPage(0); }}>
            <option value="">{t("All statuses")}</option>
            <option value="ACTIVE">{t("ACTIVE")}</option>
            <option value="INACTIVE">{t("INACTIVE")}</option>
          </AdminFilter>
        </AdminToolbar>

        <div className="mt-5">
          {loading ? <AdminLoadingState label={t("Loading users...")} /> : error && !users.length ? (
            <AdminErrorState title={t("Unable to load users")} message={error} onRetry={() => void loadUsers()} />
          ) : users.length ? (
            <>
              <div className="hidden md:block">
                <AdminDataTable columns={columns} rows={users} rowKey={(user) => user.id} caption={t("User accounts")} />
              </div>
              <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                  <Card key={user.id}><CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate font-semibold text-text">{user.displayName}</p><p className="mt-1 truncate text-sm text-text-muted">{user.email}</p></div>
                      <StatusBadge active={user.active} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3"><RoleBadge role={user.role} /><Button size="sm" variant="ghost" onClick={() => void openDetail(user.id)}>{t("View details")}</Button></div>
                  </CardContent></Card>
                ))}
              </div>
              <AdminPagination page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
            </>
          ) : (
            <AdminEmptyState
              title={noResults ? t("No users match your search.") : t("No users found.")}
              description={noResults ? t("Change or clear the current search and filters.") : undefined}
            />
          )}
        </div>
      </section>

      {detailLoading ? <div className="mt-7"><AdminLoadingState label={t("Loading user details...")} /></div> : null}
      {detail ? (
        <UserDetail
          detail={detail}
          currentUserId={currentUser.id}
          dateFormatter={dateFormatter}
          onClose={() => setDetail(undefined)}
          onChange={setChange}
        />
      ) : null}

      <AdminConfirmDialog
        open={Boolean(change)}
        title={change?.kind === "status" ? t("Change account status?") : t("Change user role?")}
        description={change ? confirmationText(change, t) : ""}
        confirmLabel={t("Confirm")}
        cancelLabel={t("Cancel")}
        pending={pending}
        danger={change?.kind === "status" && !change.active}
        onConfirm={() => void applyChange()}
        onClose={() => setChange(undefined)}
      />
    </div>
  );
}

function UserDetail({ detail, currentUserId, dateFormatter, onClose, onChange }: {
  detail: AdminUserDetail;
  currentUserId: string;
  dateFormatter: Intl.DateTimeFormat;
  onClose: () => void;
  onChange: (change: PendingChange) => void;
}) {
  const { t } = useI18n();
  const user = detail.account;
  const self = user.id === currentUserId;
  return (
    <section className="mt-8 border-t border-border pt-7" aria-labelledby="user-detail-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-2xl font-semibold text-text" id="user-detail-title">{user.displayName}</h2><p className="mt-1 text-sm text-text-muted">{user.email}</p></div>
        <Button variant="ghost" onClick={onClose}>{t("Close details")}</Button>
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card><CardContent>
          <h3 className="text-lg font-semibold text-text">{t("Account")}</h3>
          <dl className="mt-5 grid gap-4 text-sm">
            <DetailRow label={t("Role")} value={<RoleBadge role={user.role} />} />
            <DetailRow label={t("Status")} value={<StatusBadge active={user.active} />} />
            <DetailRow label={t("Created at")} value={dateFormatter.format(new Date(user.createdAt))} />
            <DetailRow label={t("Updated at")} value={dateFormatter.format(new Date(user.updatedAt))} />
          </dl>
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            <Button className="w-full" variant="secondary" disabled={self} onClick={() => onChange({ kind: "role", user, role: user.role === "ADMIN" ? "USER" : "ADMIN" })}>
              {user.role === "ADMIN" ? t("Change role to USER") : t("Change role to ADMIN")}
            </Button>
            <Button className="w-full" variant={user.active ? "danger" : "secondary"} disabled={self} onClick={() => onChange({ kind: "status", user, active: !user.active })}>
              {user.active ? t("Deactivate account") : t("Activate account")}
            </Button>
            {self ? <p className="text-xs leading-5 text-text-subtle">{t("You cannot change your own role or deactivate your own account.")}</p> : null}
          </div>
        </CardContent></Card>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label={t("Learning paths joined")} value={detail.joinedLearningPaths} />
            <AdminStatCard label={t("Tracked lessons")} value={detail.trackedLessons} hint={t("{{count}} reading-qualified", { count: detail.readingQualifiedLessons })} />
            <AdminStatCard label={t("Quiz attempts")} value={detail.quizAttempts} hint={t("{{count}} submitted", { count: detail.submittedQuizAttempts })} />
            <AdminStatCard label={t("Quiz results")} value={`${detail.passedQuizAttempts} / ${detail.failedQuizAttempts}`} hint={t("Passed / failed")} />
          </div>
          <ActivityList
            title={t("Recent lesson activity")}
            empty={t("No lesson activity.")}
            rows={detail.recentLessons.map((item) => ({
              id: item.lessonId,
              title: item.lessonTitle,
              meta: t("{{scroll}}% scroll � {{seconds}} active seconds", { scroll: item.maxScrollPercent, seconds: item.activeSeconds }),
              badge: item.readingQualified ? t("Reading qualified") : t("In progress"),
              success: item.readingQualified,
            }))}
          />
          <ActivityList
            title={t("Recent quiz activity")}
            empty={t("No quiz attempts.")}
            rows={detail.recentQuizAttempts.map((item) => ({
              id: item.attemptId,
              title: item.quizTitle,
              meta: item.scorePercentage == null ? t("Not submitted") : t("Score {{score}}%", { score: item.scorePercentage }),
              badge: item.passed == null ? t("In progress") : item.passed ? t("Passed") : t("Failed"),
              success: item.passed === true,
              danger: item.passed === false,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function ActivityList({ title, empty, rows }: { title: string; empty: string; rows: { id: string; title: string; meta: string; badge: string; success?: boolean; danger?: boolean }[] }) {
  return <Card><CardContent><h3 className="text-lg font-semibold text-text">{title}</h3>{rows.length ? <ul className="mt-4 divide-y divide-border">{rows.map((row) => <li className="flex items-center justify-between gap-4 py-3" key={row.id}><div className="min-w-0"><p className="truncate text-sm font-semibold text-text">{row.title}</p><p className="mt-1 text-xs text-text-muted">{row.meta}</p></div><Badge variant={row.success ? "success" : row.danger ? "danger" : "neutral"}>{row.badge}</Badge></li>)}</ul> : <p className="mt-4 text-sm text-text-muted">{empty}</p>}</CardContent></Card>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-text-muted">{label}</dt><dd className="text-right font-medium text-text">{value}</dd></div>;
}

function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant={role === "ADMIN" ? "info" : "neutral"}>{role}</Badge>;
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useI18n();
  return <Badge variant={active ? "success" : "neutral"}>{t(active ? "ACTIVE" : "INACTIVE")}</Badge>;
}

function confirmationText(change: PendingChange, t: (key: string, values?: Record<string, string | number>) => string) {
  if (change.kind === "status") {
    return change.active
      ? t("Activate {{email}}? The user will be able to authenticate again.", { email: change.user.email })
      : t("Deactivate {{email}}? Active refresh tokens will be revoked and login will be blocked.", { email: change.user.email });
  }
  return t("Change {{email}} from {{current}} to {{next}}?", {
    email: change.user.email,
    current: change.user.role,
    next: change.role,
  });
}

function messageOf(reason: unknown) {
  return reason instanceof Error ? reason.message : "The request could not be completed.";
}
