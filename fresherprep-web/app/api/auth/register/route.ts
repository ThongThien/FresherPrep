import { NextRequest, NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { isAuthTokens, isCurrentUser, setAuthCookies } from "@/lib/auth/session";
import type { AuthenticationResponse, RegisterInput } from "@/lib/auth/types";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  }

  const input = await readRegisterInput(request);
  if (!input) {
    return apiError(400, "INVALID_REQUEST", "Name, email, and password are required.");
  }

  try {
    const backendResponse = await backendFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const payload = await readResponseBody(backendResponse);

    if (!backendResponse.ok) {
      return backendErrorResponse(backendResponse.status, payload);
    }

    if (!isAuthenticationResponse(payload)) {
      return apiError(502, "INVALID_BACKEND_RESPONSE", "The registration response was invalid.");
    }

    const response = NextResponse.json({ user: payload.user }, { status: 201 });
    setAuthCookies(response, payload.tokens);
    return response;
  } catch {
    return apiError(503, "AUTH_SERVICE_UNAVAILABLE", "Unable to reach the authentication service.");
  }
}

async function readRegisterInput(request: NextRequest): Promise<RegisterInput | null> {
  try {
    const value = (await request.json()) as Partial<RegisterInput>;
    if (
      typeof value.displayName !== "string" ||
      typeof value.email !== "string" ||
      typeof value.password !== "string"
    ) {
      return null;
    }
    return {
      displayName: value.displayName.trim(),
      email: value.email.trim(),
      password: value.password,
    };
  } catch {
    return null;
  }
}

function isAuthenticationResponse(value: unknown): value is AuthenticationResponse {
  if (!value || typeof value !== "object") return false;
  const auth = value as Partial<AuthenticationResponse>;
  return isCurrentUser(auth.user) && isAuthTokens(auth.tokens);
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
