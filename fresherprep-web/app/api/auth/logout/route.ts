import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { apiError } from "@/lib/api/errors";
import { clearAuthCookies, getRequestTokens } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  }

  const { refreshToken } = getRequestTokens(request);
  let backendUnavailable = false;

  if (refreshToken) {
    try {
      const backendResponse = await backendFetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      backendUnavailable = backendResponse.status >= 500;
    } catch {
      backendUnavailable = true;
    }
  }

  const response = backendUnavailable
    ? apiError(503, "AUTH_SERVICE_UNAVAILABLE", "Signed out locally, but the service could not revoke the session.")
    : new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
