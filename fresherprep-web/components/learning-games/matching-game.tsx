"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import type { LearningGameCard, LearningGameDeck } from "@/lib/learning-games/types";

import { DeckPicker, GameError, GameHeader, GameLoading, NoGameDecks } from "./game-shared";
import { useGameDeck } from "./use-game-deck";

interface MatchItem {
  id: string;
  cardId: string;
  kind: "term" | "definition";
  content: string;
}

export function MatchingGame() {
  const { t } = useI18n();
  const game = useGameDeck("/games/matching");
  return (
    <div className="mx-auto w-full max-w-5xl">
      <GameHeader
        title={t("Matching")}
        description={t("Pair each lesson concept with the correct explanation.")}
      />
      {game.catalog.status === "loading" ? <GameLoading /> : null}
      {game.catalog.status === "error" ? <GameError message={game.catalog.message} onRetry={game.retryCatalog} /> : null}
      {game.catalog.status === "ready" && game.catalog.data.decks.length === 0 ? <NoGameDecks /> : null}
      {game.catalog.status === "ready" && game.catalog.data.decks.length > 0 ? (
        <>
          <DeckPicker decks={game.catalog.data.decks} value={game.selectedDeckId} onChange={game.selectDeck} />
          {game.deck.status === "loading" || game.deck.status === "idle" ? <GameLoading /> : null}
          {game.deck.status === "error" ? <GameError message={game.deck.message} onRetry={game.retryDeck} /> : null}
          {game.deck.status === "ready" && game.deck.data.cards.length === 0 ? <NoGameDecks emptyCards /> : null}
          {game.deck.status === "ready" && game.deck.data.cards.length > 0 ? <MatchingSession key={game.deck.data.id} deck={game.deck.data} /> : null}
        </>
      ) : null}
    </div>
  );
}

function MatchingSession({ deck }: { deck: LearningGameDeck }) {
  const { t } = useI18n();
  const cards = deck.cards.slice(0, 6);
  const [round, setRound] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(() => new Set());
  const [incorrect, setIncorrect] = useState<Set<string>>(() => new Set());
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const items = useMemo(() => createItems(cards, round), [cards, round]);
  const completed = matched.size === cards.length;

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  function choose(item: MatchItem) {
    if (locked || matched.has(item.cardId) || selected.includes(item.id)) return;
    if (selected.length === 0) {
      setSelected([item.id]);
      setFeedback(t("Choose the matching card."));
      return;
    }

    const first = items.find((candidate) => candidate.id === selected[0]);
    if (!first) return;
    const pair = [first.id, item.id];
    const correct = first.cardId === item.cardId && first.kind !== item.kind;
    setSelected(pair);
    setLocked(true);
    if (correct) {
      setFeedback(t("Correct match."));
    } else {
      setIncorrect(new Set(pair));
      setFeedback(t("Not a match. Try again."));
    }

    timeoutRef.current = window.setTimeout(() => {
      if (correct) setMatched((current) => new Set(current).add(item.cardId));
      setSelected([]);
      setIncorrect(new Set());
      setLocked(false);
      timeoutRef.current = null;
    }, correct ? 350 : 700);
  }

  function restart() {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setRound((value) => value + 1);
    setSelected([]);
    setMatched(new Set());
    setIncorrect(new Set());
    setLocked(false);
    setFeedback("");
  }

  return (
    <section className="mt-8" aria-labelledby="matching-deck-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{deck.technologyName}</p>
          <h2 id="matching-deck-title" className="mt-1 text-lg font-semibold text-text">{deck.name}</h2>
        </div>
        <Badge variant={completed ? "success" : "info"}>{t("{{matched}} of {{total}} matched", { matched: matched.size, total: cards.length })}</Badge>
      </div>
      <Progress className="mt-4" value={(matched.size / cards.length) * 100} label={t("Matching progress")} tone={completed ? "success" : "primary"} />

      <p className={cn("mt-4 min-h-6 text-sm font-medium", incorrect.size > 0 ? "text-danger-strong" : feedback === t("Correct match.") ? "text-success-strong" : "text-text-muted")} role="status" aria-live="polite">
        {completed ? t("All pairs matched.") : feedback || t("Select a concept or explanation to begin.")}
      </p>

      {completed ? (
        <div className="mt-4">
          <Feedback tone="success" title={t("Matching completed")}>{t("You matched all {{total}} lesson concepts.", { total: cards.length })}</Feedback>
          <Button className="mt-4" onClick={restart}>{t("Play again")}</Button>
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const isMatched = matched.has(item.cardId);
          const isSelected = selected.includes(item.id);
          const isIncorrect = incorrect.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              disabled={isMatched || locked}
              aria-pressed={isSelected}
              onClick={() => choose(item)}
              className={cn(
                "min-h-24 min-w-0 rounded-lg border bg-surface p-4 text-left transition-[border-color,background-color,transform,opacity] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 motion-reduce:transition-none",
                !isMatched && !isSelected && "border-border hover:border-primary/40 hover:bg-surface-muted active:scale-[0.99] motion-reduce:transform-none",
                isSelected && !isIncorrect && "border-primary bg-primary-subtle text-primary-strong",
                isIncorrect && "border-danger/40 bg-danger-subtle text-danger-strong",
                isMatched && "border-success/30 bg-success-subtle text-success-strong opacity-65",
              )}
            >
              <span className="block text-xs font-semibold uppercase tracking-[0.1em] opacity-70">{item.kind === "term" ? t("Concept") : t("Explanation")}</span>
              <span className="mt-2 block break-words text-sm font-medium leading-6">{item.content}</span>
              {isMatched ? <span className="mt-2 block text-xs font-semibold">✓ {t("Matched")}</span> : null}
            </button>
          );
        })}
      </div>
      {deck.cards.length > cards.length ? <p className="mt-4 text-xs text-text-subtle">{t("This round uses the first {{count}} cards to keep matching focused.", { count: cards.length })}</p> : null}
    </section>
  );
}

function createItems(cards: LearningGameCard[], round: number): MatchItem[] {
  return cards.flatMap((card) => [
    { id: `${card.id}-term`, cardId: card.id, kind: "term" as const, content: card.term },
    { id: `${card.id}-definition`, cardId: card.id, kind: "definition" as const, content: card.definition },
  ]).sort((left, right) => stableScore(left.id, round) - stableScore(right.id, round));
}

function stableScore(value: string, round: number) {
  let score = 2166136261 + round * 101;
  for (let index = 0; index < value.length; index += 1) score = Math.imul(score ^ value.charCodeAt(index), 16777619);
  return score >>> 0;
}
