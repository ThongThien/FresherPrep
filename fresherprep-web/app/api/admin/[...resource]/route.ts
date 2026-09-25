import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

const targets: Record<string, string> = {
  knowledge: "/api/knowledge/admin",
  "learning-paths": "/api/learning-paths/admin",
  lessons: "/api/lessons/admin",
  quizzes: "/api/quizzes/admin",
  questions: "/api/questions",
  users: "/api/admin/users",
};

type Context = { params: Promise<{ resource: string[] }> };

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;

async function forward(request: NextRequest, context: Context) {
  if (request.method !== "GET" && !hasTrustedOrigin(request)) {
    return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  }
  try {
    return await forwardRequest(request, context);
  } catch {
    return apiError(503, "ADMIN_SERVICE_UNAVAILABLE", "The admin service is temporarily unavailable.");
  }
}

async function forwardRequest(request: NextRequest, context: Context) {
  const { resource } = await context.params;
  const [area, ...segments] = resource;
  const base = targets[area];
  if (!base) {
    return apiError(404, "ADMIN_RESOURCE_NOT_FOUND", "The requested admin resource is unavailable.");
  }

  const suffix = segments.length ? `/${segments.map(encodeURIComponent).join("/")}` : "";
  const body = request.method === "GET" || request.method === "DELETE"
    ? undefined
    : await request.text();
  const result = await authenticatedBackendRequest(request, `${base}${suffix}${request.nextUrl.search}`, {
    method: request.method,
    body: body || undefined,
    headers: body ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : undefined,
  });
  if (!result.authenticated) return result.response;

  const response = result.ok
    ? result.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(result.payload, { status: result.status })
    : backendErrorResponse(result.status, result.payload);
  if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
  return response;
}

function hasTrustedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
