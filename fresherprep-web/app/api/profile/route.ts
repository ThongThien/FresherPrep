import { NextRequest, NextResponse } from "next/server";

import { apiError, backendErrorResponse } from "@/lib/api/errors";
import {
  clearAuthCookies,
  getRequestTokens,
  isAuthTokens,
  isCurrentUser,
  requestTokenRefresh,
  requestUpdateCurrentUser,
  setAuthCookies,
} from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  if (!hasTrustedOrigin(request)) return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_REQUEST", "A valid request body is required.");
  }

  const displayName = readDisplayName(body);
  if (!displayName) {
    return apiError(400, "INVALID_DISPLAY_NAME", "Display name is required and cannot exceed 100 characters.");
  }

  const { accessToken, refreshToken } = getRequestTokens(request);
  try {
    if (accessToken) {
      const updated = await requestUpdateCurrentUser(accessToken, displayName);
      if (updated.response.ok && isCurrentUser(updated.payload)) return NextResponse.json({ user: updated.payload });
      if (updated.response.status !== 401) return backendErrorResponse(updated.response.status, updated.payload);
    }

    if (!refreshToken) return unauthorizedResponse();
    const refreshed = await requestTokenRefresh(refreshToken);
    if (refreshed.response.status >= 500) return backendErrorResponse(refreshed.response.status, refreshed.payload);
    if (!refreshed.response.ok || !isAuthTokens(refreshed.payload)) return unauthorizedResponse();

    const updated = await requestUpdateCurrentUser(refreshed.payload.accessToken, displayName);
    if (!updated.response.ok || !isCurrentUser(updated.payload)) {
      if (updated.response.status === 401) return unauthorizedResponse();
      return backendErrorResponse(updated.response.status, updated.payload);
    }

    const response = NextResponse.json({ user: updated.payload });
    setAuthCookies(response, refreshed.payload);
    return response;
  } catch {
    return apiError(503, "PROFILE_SERVICE_UNAVAILABLE", "Unable to update the profile right now.");
  }
}

function readDisplayName(body: unknown) {
  if (!body || typeof body !== "object") return null;
  const value = (body as { displayName?: unknown }).displayName;
  if (typeof value !== "string") return null;
  const displayName = value.trim();
  return displayName.length > 0 && displayName.length <= 100 ? displayName : null;
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function unauthorizedResponse() {
  const response = apiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  clearAuthCookies(response);
  return response;
}
