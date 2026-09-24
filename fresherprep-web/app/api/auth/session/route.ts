import { NextRequest, NextResponse } from "next/server";

import { apiError, backendErrorResponse } from "@/lib/api/errors";
import {
  clearAuthCookies,
  getRequestTokens,
  isAuthTokens,
  isCurrentUser,
  requestCurrentUser,
  requestTokenRefresh,
  setAuthCookies,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { accessToken, refreshToken } = getRequestTokens(request);

  try {
    if (accessToken) {
      const currentUser = await requestCurrentUser(accessToken);
      if (currentUser.response.ok && isCurrentUser(currentUser.payload)) {
        return NextResponse.json({ user: currentUser.payload });
      }
      if (currentUser.response.status !== 401) {
        return backendErrorResponse(currentUser.response.status, currentUser.payload);
      }
    }

    if (!refreshToken) {
      return unauthorizedResponse();
    }

    const refreshed = await requestTokenRefresh(refreshToken);
    if (refreshed.response.status >= 500) {
      return backendErrorResponse(refreshed.response.status, refreshed.payload);
    }
    if (!refreshed.response.ok || !isAuthTokens(refreshed.payload)) {
      return unauthorizedResponse();
    }

    const currentUser = await requestCurrentUser(refreshed.payload.accessToken);
    if (currentUser.response.status >= 500) {
      return backendErrorResponse(currentUser.response.status, currentUser.payload);
    }
    if (!currentUser.response.ok || !isCurrentUser(currentUser.payload)) {
      return unauthorizedResponse();
    }

    const response = NextResponse.json({ user: currentUser.payload });
    setAuthCookies(response, refreshed.payload);
    return response;
  } catch {
    return apiError(503, "AUTH_SERVICE_UNAVAILABLE", "Unable to verify the current session.");
  }
}

function unauthorizedResponse() {
  const response = apiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  clearAuthCookies(response);
  return response;
}
