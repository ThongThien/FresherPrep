import { NextResponse } from "next/server";

import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";

export async function GET() {
  try {
    const response = await backendFetch("/api/learning-paths?page=0&size=6&sort=name,asc");
    const payload = await readResponseBody(response);
    return response.ok ? NextResponse.json(payload) : backendErrorResponse(response.status, payload);
  } catch {
    return apiError(503, "LEARNING_PATH_SERVICE_UNAVAILABLE", "Published learning paths are temporarily unavailable.");
  }
}
