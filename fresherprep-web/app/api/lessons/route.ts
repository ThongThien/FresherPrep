import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams({
    page: "0",
    size: "500",
    sort: "title,asc",
  });

  try {
    const result = await authenticatedBackendRequest(
      request,
      "/api/lessons?" + params.toString(),
    );
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);

    const response = NextResponse.json(result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LESSON_SERVICE_UNAVAILABLE", "Unable to load published lessons.");
  }
}
