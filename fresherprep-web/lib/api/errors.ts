import { NextResponse } from "next/server";

import type { ApiError } from "@/lib/auth/types";

const ERROR_MESSAGES: Record<number, string> = {
  400: "Please check the submitted information.",
  401: "Your email or password is incorrect.",
  403: "You do not have permission to perform this action.",
  409: "This information conflicts with an existing record.",
};

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json<ApiError>(
    {
      status,
      error: statusText(status),
      code,
      message,
      fieldErrors: {},
    },
    { status },
  );
}

export function backendErrorResponse(status: number, payload: unknown) {
  if (status >= 500) {
    return apiError(502, "BACKEND_UNAVAILABLE", "The service is temporarily unavailable.");
  }

  if (isApiError(payload)) {
    return NextResponse.json<ApiError>(
      {
        status,
        error: payload.error || statusText(status),
        code: payload.code || "REQUEST_FAILED",
        message: payload.message || ERROR_MESSAGES[status] || "The request could not be completed.",
        fieldErrors: payload.fieldErrors ?? {},
      },
      { status },
    );
  }

  return apiError(
    status,
    status === 401 ? "INVALID_CREDENTIALS" : "REQUEST_FAILED",
    ERROR_MESSAGES[status] || "The request could not be completed.",
  );
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ApiError>;
  return (
    typeof candidate.status === "number" &&
    typeof candidate.code === "string" &&
    typeof candidate.message === "string"
  );
}

function statusText(status: number) {
  if (status === 400) return "Bad Request";
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 409) return "Conflict";
  if (status === 502) return "Bad Gateway";
  if (status === 503) return "Service Unavailable";
  return "Request Failed";
}
