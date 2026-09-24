import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type {
  LearningPathProgress,
  LessonProgress,
  PageResponse,
  QuizAttemptSummary,
  UserLearningPath,
} from "@/lib/dashboard/types";
import type { ProgressData, ProgressIssue } from "@/lib/progress/types";

export async function GET(request: NextRequest) {
  try {
    const pathsResult = await authenticatedBackendRequest(request, "/api/learning-paths/me?page=0&size=100&sort=createdAt,desc");
    if (!pathsResult.authenticated) return pathsResult.response;
    if (!pathsResult.ok) return backendErrorResponse(pathsResult.status, pathsResult.payload);
    if (!isPage(pathsResult.payload)) return apiError(502, "INVALID_BACKEND_RESPONSE", "Learning progress could not be read.");

    const paths = pathsResult.payload as PageResponse<UserLearningPath>;
    const headers = { Authorization: "Bearer " + pathsResult.accessToken };
    const [lessonResult, attemptResult, progressResults] = await Promise.all([
      fetchPage<LessonProgress>("/api/lessons/me/progress?page=0&size=100&sort=lastViewedAt,desc", headers),
      fetchPage<QuizAttemptSummary>("/api/quiz-attempts?page=0&size=100&sort=createdAt,desc", headers),
      Promise.all(paths.content.map(async (membership) => {
        try {
          const response = await backendFetch("/api/learning-paths/" + membership.learningPath.id + "/progress", { headers });
          const payload = await readResponseBody(response);
          return response.ok && isObject(payload) ? payload as unknown as LearningPathProgress : null;
        } catch {
          return null;
        }
      })),
    ]);

    const issues: ProgressIssue[] = [];
    if (!lessonResult) issues.push("lessons");
    if (!attemptResult) issues.push("quizAttempts");
    if (progressResults.some((progress) => progress === null)) issues.push("pathProgress");

    const data: ProgressData = {
      paths,
      pathEntries: paths.content.map((membership, index) => ({ membership, progress: progressResults[index] })),
      lessons: lessonResult ?? emptyPage<LessonProgress>(),
      quizAttempts: attemptResult ?? emptyPage<QuizAttemptSummary>(),
      issues,
    };
    const response = NextResponse.json(data);
    if (pathsResult.refreshedTokens) setAuthCookies(response, pathsResult.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "PROGRESS_SERVICE_UNAVAILABLE", "Unable to load learning progress.");
  }
}

async function fetchPage<T>(path: string, headers: HeadersInit): Promise<PageResponse<T> | null> {
  try {
    const response = await backendFetch(path, { headers });
    const payload = await readResponseBody(response);
    return response.ok && isPage(payload) ? payload as PageResponse<T> : null;
  } catch {
    return null;
  }
}

function emptyPage<T>(): PageResponse<T> {
  return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, first: true, last: true, empty: true };
}
function isPage(value: unknown): value is PageResponse<unknown> {
  return isObject(value) && Array.isArray(value.content) && typeof value.totalElements === "number";
}
function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
