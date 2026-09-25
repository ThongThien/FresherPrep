"use client";

import { useEffect, useState } from "react";

import { readApiError } from "@/lib/api/client";
import { useI18n } from "@/lib/i18n";
import type { LearningGameDeck, LearningGamesCatalog } from "@/lib/learning-games/types";

type CatalogState =
  | { status: "loading" }
  | { status: "ready"; data: LearningGamesCatalog }
  | { status: "error"; message: string };

type DeckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: LearningGameDeck }
  | { status: "error"; message: string };

export function useGameDeck(returnPath: string) {
  const { t } = useI18n();
  const [catalog, setCatalog] = useState<CatalogState>({ status: "loading" });
  const [deck, setDeck] = useState<DeckState>({ status: "idle" });
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [catalogRequest, setCatalogRequest] = useState(0);
  const [deckRequest, setDeckRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/learning-games", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace(`/login?next=${encodeURIComponent(returnPath)}`);
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setCatalog({ status: "error", message: error.message });
          return;
        }
        const data = await response.json() as LearningGamesCatalog;
        setCatalog({ status: "ready", data });
        setSelectedDeckId((current) => current || data.decks[0]?.id || "");
        if (data.decks.length > 0) setDeck({ status: "loading" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCatalog({ status: "error", message: t("Unable to load learning game decks.") });
      });
    return () => controller.abort();
  }, [catalogRequest, returnPath, t]);

  useEffect(() => {
    if (!selectedDeckId) return;
    const controller = new AbortController();
    void fetch(`/api/learning-games/${encodeURIComponent(selectedDeckId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace(`/login?next=${encodeURIComponent(returnPath)}`);
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setDeck({ status: "error", message: error.message });
          return;
        }
        setDeck({ status: "ready", data: await response.json() as LearningGameDeck });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setDeck({ status: "error", message: t("Unable to load this learning game deck.") });
      });
    return () => controller.abort();
  }, [deckRequest, returnPath, selectedDeckId, t]);

  return {
    catalog,
    deck,
    selectedDeckId,
    selectDeck: (deckId: string) => {
      setDeck({ status: "loading" });
      setSelectedDeckId(deckId);
    },
    retryCatalog: () => {
      setCatalog({ status: "loading" });
      setCatalogRequest((value) => value + 1);
    },
    retryDeck: () => {
      setDeck({ status: "loading" });
      setDeckRequest((value) => value + 1);
    },
  };
}
