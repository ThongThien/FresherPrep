import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function GET(request: NextRequest, context: { params: Promise<{ quizId: string }> }) {
  return forward(request, context, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ quizId: string }> }) {
  if (!trusted(request)) return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  return forward(request, context, "POST");
}

async function forward(request: NextRequest, context: { params: Promise<{ quizId: string }> }, method: "GET" | "POST") {
  const { quizId } = await context.params;
  const path = method === "GET" ? "/api/quizzes/" + encodeURIComponent(quizId) : "/api/quizzes/" + encodeURIComponent(quizId) + "/attempts";
  try {
    const result = await authenticatedBackendRequest(request, path, { method });
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    const response = NextResponse.json(result.payload, { status: method === "POST" ? 201 : 200 });
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "QUIZ_SERVICE_UNAVAILABLE", "Unable to reach the quiz service.");
  }
}

function trusted(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
