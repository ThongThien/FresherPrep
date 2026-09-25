import { NextRequest, NextResponse } from "next/server";

import { authenticatedBackendRequest } from "@/lib/api/authenticated-backend";
import { backendFetch } from "@/lib/api/backend";
import { apiError, backendErrorResponse, readResponseBody } from "@/lib/api/errors";
import { setAuthCookies } from "@/lib/auth/session";
import type { LearningPathDetail } from "@/lib/learning-paths/types";
import type { LearningGameDeck } from "@/lib/learning-games/types";
import type { LessonDetail } from "@/lib/lessons/types";

export async function GET(request: NextRequest, context: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await context.params;
  try {
    const pathResult = await authenticatedBackendRequest(
      request,
      `/api/learning-paths/${encodeURIComponent(pathId)}`,
    );
    if (!pathResult.authenticated) return pathResult.response;
    if (!pathResult.ok) return backendErrorResponse(pathResult.status, pathResult.payload);
    if (!isLearningPathDetail(pathResult.payload)) {
      return apiError(502, "INVALID_BACKEND_RESPONSE", "The learning game deck could not be read.");
    }

    const orderedItems = [...pathResult.payload.items].sort((left, right) => left.displayOrder - right.displayOrder);
    const lessonResults = await Promise.all(
      orderedItems.map(async (item) => {
        const response = await backendFetch(`/api/lessons/${encodeURIComponent(item.lessonId)}`, {
          headers: { Authorization: `Bearer ${pathResult.accessToken}` },
        });
        return { response, payload: await readResponseBody(response) };
      }),
    );
    if (lessonResults.some(({ response, payload }) => !response.ok || !isLessonDetail(payload))) {
      return apiError(502, "INCOMPLETE_GAME_DECK", "Some published lesson content could not be loaded.");
    }

    const deck: LearningGameDeck = {
      id: pathResult.payload.id,
      name: pathResult.payload.name,
      technologyName: pathResult.payload.technologyName,
      cards: lessonResults.map(({ payload }) => {
        const lesson = payload as LessonDetail;
        return {
          id: lesson.id,
          term: lesson.title,
          definition: toPlainText(lesson.content),
        };
      }).filter((card) => card.definition.length > 0),
    };
    const response = NextResponse.json(deck);
    if (pathResult.refreshedTokens) setAuthCookies(response, pathResult.refreshedTokens);
    return response;
  } catch {
    return apiError(503, "LEARNING_GAMES_UNAVAILABLE", "This learning game deck is temporarily unavailable.");
  }
}

function toPlainText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*(?:[-*>]|\d+\.)\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

function isLearningPathDetail(value: unknown): value is LearningPathDetail {
  return Boolean(value) && typeof value === "object"
    && typeof (value as LearningPathDetail).id === "string"
    && typeof (value as LearningPathDetail).name === "string"
    && Array.isArray((value as LearningPathDetail).items);
}

function isLessonDetail(value: unknown): value is LessonDetail {
  return Boolean(value) && typeof value === "object"
    && typeof (value as LessonDetail).id === "string"
    && typeof (value as LessonDetail).title === "string"
    && typeof (value as LessonDetail).content === "string";
}
