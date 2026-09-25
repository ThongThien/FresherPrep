import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { apiError, backendErrorResponse } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type { LearningPathSummary, PageResponse } from "@/lib/learning-paths/types";
import type { LearningGamesCatalog } from "@/lib/learning-games/types";

export async function GET(request: NextRequest) {
  try {
    const result = await authenticatedBackendRequest(
      request,
      "/api/learning-paths?page=0&size=100&sort=name,asc",
    );
    if (!result.authenticated) return result.response;
    if (!result.ok) return backendErrorResponse(result.status, result.payload);
    if (!isPage(result.payload)) {
      return apiError(502, "INVALID_BACKEND_RESPONSE", "Learning game decks could not be read.");
    }

    const data: LearningGamesCatalog = {
      decks: result.payload.content.map((path) => ({
        id: path.id,
        name: path.name,
        technologyName: path.technologyName,
      })),
    };
    const response = NextResponse.json(data);
    if (result.refreshedTokens) setAuthCookies(response, result.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LEARNING_GAMES_UNAVAILABLE", "Learning game decks are temporarily unavailable.");
  }
}

function isPage(value: unknown): value is PageResponse<LearningPathSummary> {
  return Boolean(value) && typeof value === "object" && Array.isArray((value as PageResponse<LearningPathSummary>).content);
}
