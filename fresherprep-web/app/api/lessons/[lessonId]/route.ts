import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type { LearningPathDetail } from "@/lib/learning-paths/types";
import type { LessonDetail, LessonDetailData, LessonPathContext, LessonSummary } from "@/lib/lessons/types";

export async function GET(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await context.params;
  try {
    const lessonResult = await authenticatedBackendRequest(request, "/api/lessons/" + encodeURIComponent(lessonId));
    if (!lessonResult.authenticated) return lessonResult.response;
    if (!lessonResult.ok) return backendErrorResponse(lessonResult.status, lessonResult.payload);
    if (!isLessonDetail(lessonResult.payload)) return apiError(502, "INVALID_BACKEND_RESPONSE", "The lesson could not be read.");
    const data: LessonDetailData = {
      lesson: lessonResult.payload,
      pathContext: await getPathContext(request.nextUrl.searchParams.get("pathId"), lessonId),
    };
    const response = NextResponse.json(data);
    if (lessonResult.refreshedTokens) setAuthCookies(response, lessonResult.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LESSON_SERVICE_UNAVAILABLE", "Unable to load this lesson.");
  }
}

async function getPathContext(pathId: string | null, lessonId: string): Promise<LessonPathContext | null> {
  if (!pathId) return null;
  const response = await backendFetch("/api/learning-paths/" + encodeURIComponent(pathId));
  const payload = await readResponseBody(response);
  if (!response.ok || !isLearningPathDetail(payload)) return null;
  const items = [...payload.items].sort((left, right) => left.displayOrder - right.displayOrder);
  const currentIndex = items.findIndex((item) => item.lessonId === lessonId);
  if (currentIndex === -1) return null;
  return { id: payload.id, name: payload.name, previous: toLessonSummary(items[currentIndex - 1]), next: toLessonSummary(items[currentIndex + 1]) };
}

function toLessonSummary(item: LearningPathDetail["items"][number] | undefined): LessonSummary | null {
  if (!item) return null;
  return { id: item.lessonId, subtopicId: "", title: item.lessonTitle, slug: item.lessonSlug, status: item.lessonStatus, displayOrder: item.displayOrder, minimumReadSeconds: 0, requiredScrollPercent: 0 };
}

function isLessonDetail(value: unknown): value is LessonDetail {
  return isObject(value) && typeof value.id === "string" && typeof value.title === "string" && typeof value.content === "string" && Array.isArray(value.prerequisites);
}

function isLearningPathDetail(value: unknown): value is LearningPathDetail {
  return isObject(value) && typeof value.id === "string" && typeof value.name === "string" && Array.isArray(value.items);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}
