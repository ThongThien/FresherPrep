import type { NextRequest } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import {
  clearAuthCookies,
  getRequestTokens,
  isAuthTokens,
  requestTokenRefresh,
} from "@/lib/auth/session";
import type { AuthTokens } from "@/lib/auth/types";

type AuthenticatedBackendResult =
  | {
      authenticated: true;
      accessToken: string;
      refreshedTokens: AuthTokens | null;
      ok: boolean;
      status: number;
      payload: unknown;
    }
  | {
      authenticated: false;
      response: ReturnType<typeof apiError>;
    };

export async function authenticatedBackendRequest(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<AuthenticatedBackendResult> {
  const requestTokens = getRequestTokens(request);
  let accessToken = requestTokens.accessToken;
  let refreshedTokens: AuthTokens | null = null;

  if (!accessToken) {
    const refreshed = await refreshAccessToken(requestTokens.refreshToken);
    if (!refreshed.ok) return refreshed;
    accessToken = refreshed.tokens.accessToken;
    refreshedTokens = refreshed.tokens;
  }

  let backendResponse = await requestWithToken(path, accessToken, init);
  if (backendResponse.status === 401 && !refreshedTokens) {
    const refreshed = await refreshAccessToken(requestTokens.refreshToken);
    if (!refreshed.ok) return refreshed;
    accessToken = refreshed.tokens.accessToken;
    refreshedTokens = refreshed.tokens;
    backendResponse = await requestWithToken(path, accessToken, init);
  }

  if (backendResponse.status === 401) {
    return { authenticated: false, response: unauthorizedResponse() };
  }

  return {
    authenticated: true,
    accessToken,
    refreshedTokens,
    ...backendResponse,
  };
}

async function requestWithToken(path: string, accessToken: string, init: RequestInit) {
  const response = await backendFetch(path, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return {
    ok: response.ok,
    status: response.status,
    payload: await readResponseBody(response),
  };
}

async function refreshAccessToken(refreshToken?: string) {
  if (!refreshToken) {
    return { authenticated: false as const, response: unauthorizedResponse(), ok: false as const };
  }

  const refreshed = await requestTokenRefresh(refreshToken);
  if (refreshed.response.status >= 500) {
    return {
      authenticated: false as const,
      response: backendErrorResponse(refreshed.response.status, refreshed.payload),
      ok: false as const,
    };
  }
  if (!refreshed.response.ok || !isAuthTokens(refreshed.payload)) {
    return { authenticated: false as const, response: unauthorizedResponse(), ok: false as const };
  }
  return { ok: true as const, tokens: refreshed.payload };
}

function unauthorizedResponse() {
  const response = apiError(401, "AUTHENTICATION_REQUIRED", "Please sign in to continue.");
  clearAuthCookies(response);
  return response;
}
