import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import type { AdminDashboardData, AdminMetric, ContentStatus } from "@/lib/admin/types";
import { setAuthCookies } from "@/lib/auth/session";

const statuses: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];

export async function GET(request: NextRequest) {
  try {
    const quizResult = await authenticatedBackendRequest(
      request,
      "/api/quizzes/admin?page=0&size=200&sort=title,asc",
    );
    if (!quizResult.authenticated) return quizResult.response;
    if (!quizResult.ok) return withTokens(
      backendErrorResponse(quizResult.status, quizResult.payload),
      quizResult.refreshedTokens,
    );

    const sources = await Promise.all([
      loadAdminSource("/api/learning-paths/admin?page=0&size=200&sort=name,asc", quizResult.accessToken),
      loadAdminSource("/api/lessons/admin?page=0&size=200&sort=title,asc", quizResult.accessToken),
      loadAdminSource("/api/questions?page=0&size=200&sort=code,asc", quizResult.accessToken),
      loadAdminSource("/api/knowledge/admin/nodes", quizResult.accessToken),
    ]);
    const authorizationFailure = sources.find((source) => source.status === 401 || source.status === 403);
    if (authorizationFailure) return withTokens(
      backendErrorResponse(authorizationFailure.status, authorizationFailure.payload),
      quizResult.refreshedTokens,
    );

    const definitions = [
      pageMetric("quizzes", "Quizzes", { ok: true, payload: quizResult.payload }),
      pageMetric("learningPaths", "Learning paths", sources[0]),
      pageMetric("lessons", "Lessons", sources[1]),
      pageMetric("questions", "Questions", sources[2]),
      listMetric("knowledge", "Knowledge nodes", sources[3]),
    ];
    const metrics = definitions.flatMap((item) => item.metric ? [item.metric] : []);
    const unavailable = definitions.flatMap((item) => item.metric ? [] : [item.label]);
    const statusTotals = definitions.every((item) => item.statusCounts)
      ? definitions.reduce<Record<ContentStatus, number>>(
          (totals, item) => {
            for (const status of statuses) totals[status] += item.statusCounts?.[status] ?? 0;
            return totals;
          },
          { DRAFT: 0, REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 },
        )
      : null;

    const response = NextResponse.json<AdminDashboardData>({ metrics, statusTotals, unavailable });
    if (quizResult.refreshedTokens) setAuthCookies(response, quizResult.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "ADMIN_DASHBOARD_UNAVAILABLE", "Unable to load the admin dashboard.");
  }
}

async function loadAdminSource(path: string, accessToken: string) {
  const response = await backendFetch(path, { headers: { Authorization: "Bearer " + accessToken } });
  return { ok: response.ok, status: response.status, payload: await readResponseBody(response) };
}

function pageMetric(key: AdminMetric["key"], label: string, source: { ok: boolean; payload: unknown }) {
  if (!source.ok || !isPage(source.payload)) return { label, metric: null, statusCounts: null };
  const metric: AdminMetric = { key, label, total: source.payload.totalElements };
  const statusCounts = source.payload.content.length === source.payload.totalElements
    ? countStatuses(source.payload.content)
    : null;
  return { label, metric, statusCounts };
}

function listMetric(key: AdminMetric["key"], label: string, source: { ok: boolean; payload: unknown }) {
  if (!source.ok || !Array.isArray(source.payload)) return { label, metric: null, statusCounts: null };
  const metric: AdminMetric = { key, label, total: source.payload.length };
  return { label, metric, statusCounts: countStatuses(source.payload) };
}

function countStatuses(items: unknown[]): Record<ContentStatus, number> | null {
  const counts: Record<ContentStatus, number> = { DRAFT: 0, REVIEW: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const value of items) {
    if (!value || typeof value !== "object") return null;
    const status = (value as Record<string, unknown>).status;
    if (!statuses.includes(status as ContentStatus)) return null;
    counts[status as ContentStatus] += 1;
  }
  return counts;
}

function isPage(value: unknown): value is { totalElements: number; content: unknown[] } {
  if (!value || typeof value !== "object") return false;
  const page = value as Record<string, unknown>;
  return typeof page.totalElements === "number" && Array.isArray(page.content);
}

function withTokens(response: NextResponse, tokens: Parameters<typeof setAuthCookies>[1] | null) {
  if (tokens) setAuthCookies(response, tokens);
  return response;
}
