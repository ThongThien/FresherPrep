import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function PATCH(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  if (!trusted(request)) return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  const body = await request.json().catch(() => null);
  if (!valid(body)) return apiError(400, "INVALID_PROGRESS_UPDATE", "Reading time and scroll progress are invalid.");
  const { lessonId } = await context.params;
  try {
    const result = await authenticatedBackendRequest(request, "/api/lessons/" + encodeURIComponent(lessonId) + "/progress", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    const response = NextResponse.json(result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch { return apiError(503, "LESSON_SERVICE_UNAVAILABLE", "Unable to update lesson progress."); }
}

function valid(value: unknown): value is { activeSeconds: number; scrollPercent: number } {
  if (!value || typeof value !== "object") return false;
  const item = value as { activeSeconds?: unknown; scrollPercent?: unknown };
  return typeof item.activeSeconds === "number" && Number.isInteger(item.activeSeconds) && item.activeSeconds >= 0 && typeof item.scrollPercent === "number" && Number.isInteger(item.scrollPercent) && item.scrollPercent >= 0 && item.scrollPercent <= 100;
}
function trusted(request: NextRequest) { const origin = request.headers.get("origin"); return !origin || origin === request.nextUrl.origin; }
