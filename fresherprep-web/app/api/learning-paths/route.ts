import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type {
  LearningPathListData,
  LearningPathProgress,
  LearningPathSummary,
  PageResponse,
  UserLearningPath,
} from "@/lib/learning-paths/types";

const PAGE_SIZE = 10;

export async function GET(request: NextRequest) {
  const page = parsePage(request.nextUrl.searchParams.get("page"));

  try {
    const publishedResponse = await backendFetch(
      `/api/learning-paths?page=${page}&size=${PAGE_SIZE}&sort=name,asc`,
    );
    const publishedPayload = await readResponseBody(publishedResponse);
    if (!publishedResponse.ok) {
      return backendErrorResponse(publishedResponse.status, publishedPayload);
    }
    if (!isPage<LearningPathSummary>(publishedPayload)) {
      return apiError(502, "INVALID_BACKEND_RESPONSE", "Learning paths could not be read.");
    }

    const membershipsResult = await authenticatedBackendRequest(
      request,
      "/api/learning-paths/me?page=0&size=100&sort=createdAt,desc",
    );
    if (!membershipsResult.authenticated) return membershipsResult.response;

    let memberships: UserLearningPath[] = [];
    let membershipUnavailable = false;
    if (membershipsResult.ok && isPage<UserLearningPath>(membershipsResult.payload)) {
      memberships = membershipsResult.payload.content;
      if (membershipsResult.payload.totalPages > 1) {
        const remainingPages = await Promise.allSettled(
          Array.from(
            { length: membershipsResult.payload.totalPages - 1 },
            (_, index) => index + 1,
          ).map(async (membershipPage) => {
            const response = await backendFetch(
              `/api/learning-paths/me?page=${membershipPage}&size=100&sort=createdAt,desc`,
              { headers: { Authorization: `Bearer ${membershipsResult.accessToken}` } },
            );
            const payload = await readResponseBody(response);
            return response.ok && isPage<UserLearningPath>(payload) ? payload.content : null;
          }),
        );
        for (const result of remainingPages) {
          if (result.status === "fulfilled" && result.value) {
            memberships.push(...result.value);
          } else {
            membershipUnavailable = true;
          }
        }
      }
    } else {
      membershipUnavailable = true;
    }

    const membershipByPathId = new Map(
      memberships.map((membership) => [membership.learningPath.id, membership]),
    );
    const progressResults = await Promise.allSettled(
      publishedPayload.content.map(async (path) => {
        if (!membershipByPathId.has(path.id)) return null;
        const response = await backendFetch(`/api/learning-paths/${path.id}/progress`, {
          headers: { Authorization: `Bearer ${membershipsResult.accessToken}` },
        });
        return {
          pathId: path.id,
          ok: response.ok,
          payload: await readResponseBody(response),
        };
      }),
    );

    const progressByPathId = new Map<string, LearningPathProgress>();
    const unavailableProgress = new Set<string>();
    for (const [index, result] of progressResults.entries()) {
      const pathId = publishedPayload.content[index]?.id;
      if (result.status === "rejected") {
        if (pathId && membershipByPathId.has(pathId)) unavailableProgress.add(pathId);
        continue;
      }
      if (!result.value) continue;
      if (result.value.ok && isObject(result.value.payload)) {
        progressByPathId.set(
          result.value.pathId,
          result.value.payload as unknown as LearningPathProgress,
        );
      } else {
        unavailableProgress.add(result.value.pathId);
      }
    }

    const data: LearningPathListData = {
      paths: publishedPayload,
      entries: publishedPayload.content.map((path) => ({
        path,
        joined: membershipUnavailable ? null : membershipByPathId.has(path.id),
        progress: progressByPathId.get(path.id) ?? null,
        progressUnavailable: unavailableProgress.has(path.id),
      })),
      membershipUnavailable,
    };

    const response = NextResponse.json(data);
    if (membershipsResult.refreshedTokens) {
      setAuthCookies(response, membershipsResult.refreshedTokens);
    }
    return response;
  } catch {
    return apiError(503, "LEARNING_PATH_SERVICE_UNAVAILABLE", "Unable to load learning paths right now.");
  }
}

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function isPage<T>(value: unknown): value is PageResponse<T> {
  return isObject(value) && Array.isArray(value.content) && typeof value.totalElements === "number";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
