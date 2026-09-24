import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function POST(request: NextRequest, context: { params: Promise<{ lessonId: string }> }) {
  if (!hasTrustedOrigin(request)) return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  const { lessonId } = await context.params;
  try {
    const result = await authenticatedBackendRequest(request, "/api/lessons/" + encodeURIComponent(lessonId) + "/progress/start", { method: "POST" });
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    const response = NextResponse.json(result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LESSON_SERVICE_UNAVAILABLE", "Unable to start lesson progress.");
  }
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
