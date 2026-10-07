import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import type { AdminDashboardData } from "@/lib/admin/types";
import { setAuthCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedBackendRequest(
      request,
      "/api/admin/dashboard",
    );
    if (!result.authenticated) return result.response;
    if (!result.ok) {
      return withTokens(
        backendErrorResponse(result.status, result.payload),
        result.refreshedTokens,
      );
    }

    const response = NextResponse.json(result.payload as AdminDashboardData);
    if (result.refreshedTokens) {
      setAuthCookies(response, result.refreshedTokens);
    }
    return response;
  } catch {
    return apiError(
      503,
      "ADMIN_DASHBOARD_UNAVAILABLE",
      "Unable to load the admin dashboard.",
    );
  }
}

function withTokens(
  response: NextResponse,
  tokens: Parameters<typeof setAuthCookies>[1] | null,
) {
  if (tokens) setAuthCookies(response, tokens);
  return response;
}
