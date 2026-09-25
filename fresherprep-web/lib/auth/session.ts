import type { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { readResponseBody } from "@/lib/api/errors";

import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./constants";
import type { AuthTokens, CurrentUser } from "./types";

const DEFAULT_REFRESH_COOKIE_AGE_SECONDS = 30 * 24 * 60 * 60;

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const accessExpiry = new Date(tokens.accessTokenExpiresAt);
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...common,
    expires: Number.isNaN(accessExpiry.getTime()) ? undefined : accessExpiry,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: refreshCookieAge(),
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requestCurrentUser(accessToken: string) {
  const response = await backendFetch("/api/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { response, payload: await readResponseBody(response) };
}

export async function requestUpdateCurrentUser(accessToken: string, displayName: string) {
  const response = await backendFetch("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ displayName }),
  });
  return { response, payload: await readResponseBody(response) };
}

export async function requestTokenRefresh(refreshToken: string) {
  const response = await backendFetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  return { response, payload: await readResponseBody(response) };
}

export function getRequestTokens(request: NextRequest) {
  return {
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export function isAuthTokens(value: unknown): value is AuthTokens {
  if (!value || typeof value !== "object") return false;
  const token = value as Partial<AuthTokens>;
  return (
    typeof token.accessToken === "string" &&
    token.accessToken.length > 0 &&
    typeof token.accessTokenExpiresAt === "string" &&
    typeof token.refreshToken === "string" &&
    token.refreshToken.length > 0
  );
}

export function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<CurrentUser>;
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.displayName === "string" &&
    (user.role === "USER" || user.role === "ADMIN")
  );
}

function refreshCookieAge() {
  const configured = Number(process.env.AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_REFRESH_COOKIE_AGE_SECONDS;
}
