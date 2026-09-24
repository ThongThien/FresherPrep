import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import {
  clearAuthCookies,
  getRequestTokens,
  isAuthTokens,
  requestTokenRefresh,
  setAuthCookies,
} from "@/lib/auth/session";
import type {
  DashboardData,
  DashboardSection,
  LearningPathProgress,
  LessonProgress,
  PageResponse,
  QuizAttemptSummary,
  UserLearningPath,
} from "@/lib/dashboard/types";

export async function GET(request: NextRequest) {
  const requestTokens = getRequestTokens(request);
  let accessToken = requestTokens.accessToken;
  let refreshedTokens = null;

  try {
    if (!accessToken) {
      const refreshResult = await refreshAccessToken(requestTokens.refreshToken);
      if (!refreshResult.ok) return refreshResult.response;
      accessToken = refreshResult.tokens.accessToken;
      refreshedTokens = refreshResult.tokens;
    }

    let dashboard = await loadDashboard(accessToken);
    if (dashboard.unauthorized) {
      const refreshResult = await refreshAccessToken(requestTokens.refreshToken);
      if (!refreshResult.ok) return refreshResult.response;
      refreshedTokens = refreshResult.tokens;
      dashboard = await loadDashboard(refreshResult.tokens.accessToken);
    }

    if (dashboard.unauthorized || !dashboard.data) {
      return unauthorizedResponse();
    }

    const response = NextResponse.json(dashboard.data);
    if (refreshedTokens) setAuthCookies(response, refreshedTokens);
    return response;
  } catch {
    return apiError(503, "DASHBOARD_SERVICE_UNAVAILABLE", "Unable to load learning data right now.");
  }
}

async function loadDashboard(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const results = await Promise.allSettled([
    fetchJson("/api/learning-paths/me?size=4&sort=createdAt,desc", headers),
    fetchJson("/api/lessons/me/progress?size=8&sort=lastViewedAt,desc", headers),
    fetchJson("/api/quiz-attempts?size=6&sort=createdAt,desc", headers),
  ]);

  if (results.some((result) => result.status === "fulfilled" && result.value.status === 401)) {
    return { unauthorized: true, data: null };
  }

  const issues: DashboardSection[] = [];
  const paths = pageResult<UserLearningPath>(results[0], "paths", issues);
  const lessonProgress = pageResult<LessonProgress>(results[1], "lessons", issues);
  const quizAttempts = pageResult<QuizAttemptSummary>(results[2], "quizAttempts", issues);

  let latestPathProgress: LearningPathProgress | null = null;
  const latestPath = paths.content[0]?.learningPath;
  if (latestPath) {
    try {
      const progress = await fetchJson(`/api/learning-paths/${latestPath.id}/progress`, headers);
      if (progress.status === 401) return { unauthorized: true, data: null };
      if (progress.ok && isObject(progress.payload)) {
        latestPathProgress = progress.payload as unknown as LearningPathProgress;
      } else {
        issues.push("pathProgress");
      }
    } catch {
      issues.push("pathProgress");
    }
  }

  return {
    unauthorized: false,
    data: {
      paths,
      latestPathProgress,
      lessonProgress,
      quizAttempts,
      issues,
    } satisfies DashboardData,
  };
}

async function fetchJson(path: string, headers: HeadersInit) {
  const response = await backendFetch(path, { headers });
  return { ok: response.ok, status: response.status, payload: await readResponseBody(response) };
}

function pageResult<T>(
  result: PromiseSettledResult<Awaited<ReturnType<typeof fetchJson>>>,
  section: DashboardSection,
  issues: DashboardSection[],
): PageResponse<T> {
  if (result.status === "fulfilled" && result.value.ok && isPage(result.value.payload)) {
    return result.value.payload as PageResponse<T>;
  }
  issues.push(section);
  return emptyPage<T>();
}

async function refreshAccessToken(refreshToken?: string) {
  if (!refreshToken) return { ok: false as const, response: unauthorizedResponse() };

  const refreshed = await requestTokenRefresh(refreshToken);
  if (refreshed.response.status >= 500) {
    return {
      ok: false as const,
      response: backendErrorResponse(refreshed.response.status, refreshed.payload),
    };
  }
  if (!refreshed.response.ok || !isAuthTokens(refreshed.payload)) {
    return { ok: false as const, response: unauthorizedResponse() };
  }
  return { ok: true as const, tokens: refreshed.payload };
}

function unauthorizedResponse() {
  const response = apiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  clearAuthCookies(response);
  return response;
}

function emptyPage<T>(): PageResponse<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 0,
    first: true,
    last: true,
    empty: true,
  };
}

function isPage(value: unknown): value is PageResponse<unknown> {
  return (
    isObject(value) &&
    Array.isArray(value.content) &&
    typeof value.totalElements === "number"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
