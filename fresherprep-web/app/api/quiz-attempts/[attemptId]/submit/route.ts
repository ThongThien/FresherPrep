import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";

export async function POST(request: NextRequest, context: { params: Promise<{ attemptId: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return apiError(403, "UNTRUSTED_ORIGIN", "The request origin is not allowed.");
  const body = await request.json().catch(() => null);
  if (!valid(body)) return apiError(400, "INVALID_SUBMISSION", "Answers must contain valid question and option identifiers.");
  const { attemptId } = await context.params;
  try {
    const result = await authenticatedBackendRequest(request, "/api/quiz-attempts/" + encodeURIComponent(attemptId) + "/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    const response = NextResponse.json(result.payload);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "QUIZ_SERVICE_UNAVAILABLE", "Unable to submit this attempt.");
  }
}

function valid(value: unknown): value is { answers: Array<{ attemptQuestionId: string; optionId: string }> } {
  if (!value || typeof value !== "object") return false;
  const answers = (value as Record<string, unknown>).answers;
  return Array.isArray(answers) && answers.every((answer) => {
    if (!answer || typeof answer !== "object") return false;
    const item = answer as Record<string, unknown>;
    return typeof item.attemptQuestionId === "string" && typeof item.optionId === "string";
  });
}
