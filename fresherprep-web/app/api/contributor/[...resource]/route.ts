import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

type Context = { params: Promise<{ resource: string[] }> };

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;

async function forward(request: NextRequest, context: Context) {
  if (request.method !== "GET" && !hasTrustedOrigin(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  }
  try {
    const { resource } = await context.params;
    const suffix = resource.map(encodeURIComponent).join("/");
    const body = request.method === "GET" || request.method === "DELETE" ? undefined : await request.text();
    const result = await authenticatedBackendRequest(
      request,
      `/api/contributor/${suffix}${request.nextUrl.search}`,
      {
        method: request.method,
        body: body || undefined,
        headers: body ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : undefined,
      },
    );
    if (!result.authenticated) return result.response;
    const response = result.ok
      ? NextResponse.json(result.payload, { status: result.status })
      : backendErrorResponse(result.status, result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "CONTRIBUTOR_SERVICE_UNAVAILABLE", "The contributor service is temporarily unavailable.");
  }
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
