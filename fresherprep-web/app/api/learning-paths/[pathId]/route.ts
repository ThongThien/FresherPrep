import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type {
  LearningPathDetail,
  LearningPathDetailData,
  LearningPathProgress,
  LessonProgress,
  PageResponse,
} from "@/lib/learning-paths/types";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ pathId: string }> },
) {
  const { pathId } = await context.params;

  try {
    const detailResponse = await backendFetch(`/api/learning-paths/${pathId}`);
    const detailPayload = await readResponseBody(detailResponse);
    if (!detailResponse.ok) return backendErrorResponse(detailResponse.status, detailPayload);
    if (!isLearningPathDetail(detailPayload)) {
      return apiError(502, "INVALID_BACKEND_RESPONSE", "The learning path could not be read.");
    }

    const progressResult = await authenticatedBackendRequest(
      request,
      `/api/learning-paths/${pathId}/progress`,
    );
    if (!progressResult.authenticated) return progressResult.response;

    let joined: boolean | null = null;
    let progress: LearningPathProgress | null = null;
    let progressUnavailable = false;
    let lessonProgress: LessonProgress[] = [];
    let lessonProgressUnavailable = false;

    if (progressResult.ok && isObject(progressResult.payload)) {
      joined = true;
      progress = progressResult.payload as unknown as LearningPathProgress;

      const lessonsResponse = await backendFetch(
        "/api/lessons/me/progress?page=0&size=100&sort=lastViewedAt,desc",
        { headers: { Authorization: `Bearer ${progressResult.accessToken}` } },
      );
      const lessonsPayload = await readResponseBody(lessonsResponse);
      if (lessonsResponse.ok && isPage<LessonProgress>(lessonsPayload)) {
        lessonProgress = lessonsPayload.content;
        lessonProgressUnavailable = lessonsPayload.totalPages > 1;
      } else {
        lessonProgressUnavailable = true;
      }
    } else if (progressResult.status === 409) {
      joined = false;
    } else {
      progressUnavailable = true;
    }

    const data: LearningPathDetailData = {
      path: detailPayload,
      joined,
      progress,
      lessonProgress,
      progressUnavailable,
      lessonProgressUnavailable,
    };
    const response = NextResponse.json(data);
    if (progressResult.refreshedTokens) setAuthCookies(response, progressResult.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LEARNING_PATH_SERVICE_UNAVAILABLE", "Unable to load this learning path.");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ pathId: string }> },
) {
  if (!hasTrustedOrigin(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  }

  const { pathId } = await context.params;
  try {
    const result = await authenticatedBackendRequest(
      request,
      `/api/learning-paths/${pathId}/join`,
      { method: "POST" },
    );
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);

    const response = NextResponse.json({ membership: result.payload }, { status: 201 });
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LEARNING_PATH_SERVICE_UNAVAILABLE", "Unable to join this learning path.");
  }
}

function isLearningPathDetail(value: unknown): value is LearningPathDetail {
  return isObject(value) && typeof value.id === "string" && Array.isArray(value.items);
}

function isPage<T>(value: unknown): value is PageResponse<T> {
  return isObject(value) && Array.isArray(value.content) && typeof value.totalElements === "number";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
