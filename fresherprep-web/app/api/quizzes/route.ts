import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const page = Math.max(0, Number.parseInt(request.nextUrl.searchParams.get("page") ?? "0", 10) || 0);
  try {
    const result = await authenticatedBackendRequest(
      request,
      "/api/quizzes?page=" + page + "&size=12&sort=title,asc",
    );
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    const response = NextResponse.json(result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "QUIZ_SERVICE_UNAVAILABLE", "Unable to load available quizzes.");
  }
}
