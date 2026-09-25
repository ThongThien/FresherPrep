"use client";

import { useState } from "react";

import { Badge, Button, Feedback, Progress } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { LearningGameDeck } from "@/lib/learning-games/types";

import { DeckPicker, GameError, GameHeader, GameLoading, NoGameDecks } from "./game-shared";
import { useGameDeck } from "./use-game-deck";

export function FlashcardGame() {
  const { t } = useI18n();
  const game = useGameDeck("/games/flashcards");

  return (
    <div className="mx-auto w-full max-w-5xl">
      <GameHeader
        title={t("Flashcard")}
        description={t("Reveal each lesson explanation, then decide whether you remember the concept.")}
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
          {game.deck.status === "ready" && game.deck.data.cards.length > 0 ? <FlashcardSession key={game.deck.data.id} deck={game.deck.data} /> : null}
        </>
      ) : null}
    </div>
  );
}

function FlashcardSession({ deck }: { deck: LearningGameDeck }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, "remembered" | "review">>({});
  const card = deck.cards[index];
  const reviewed = Object.keys(decisions).length;
  const remembered = Object.values(decisions).filter((value) => value === "remembered").length;
  const completed = reviewed === deck.cards.length;

  function move(nextIndex: number) {
    setIndex(Math.min(deck.cards.length - 1, Math.max(0, nextIndex)));
    setFlipped(false);
  }

  function mark(decision: "remembered" | "review") {
    setDecisions((current) => ({ ...current, [card.id]: decision }));
    if (index < deck.cards.length - 1) move(index + 1);
  }

  function restart() {
    setIndex(0);
    setFlipped(false);
    setDecisions({});
  }

  if (completed) {
    return (
      <section className="mt-8" aria-labelledby="flashcard-complete-title">
        <Feedback tone="success" title={t("Flashcard deck completed")}>
          {t("You remembered {{remembered}} of {{total}} cards.", { remembered, total: deck.cards.length })}
        </Feedback>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={restart}>{t("Review again")}</Button>
          <Button variant="secondary" onClick={() => {
            const firstReview = deck.cards.findIndex((item) => decisions[item.id] === "review");
            if (firstReview >= 0) {
              const reviewOnly = Object.fromEntries(Object.entries(decisions).filter(([, value]) => value === "remembered"));
              setDecisions(reviewOnly);
              move(firstReview);
            }
          }} disabled={remembered === deck.cards.length}>
            {t("Review difficult cards")}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="flashcard-deck-title">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{deck.technologyName}</p>
          <h2 id="flashcard-deck-title" className="mt-1 text-lg font-semibold text-text">{deck.name}</h2>
        </div>
        <Badge variant="info">{t("Card {{current}} of {{total}}", { current: index + 1, total: deck.cards.length })}</Badge>
      </div>
      <Progress value={((index + 1) / deck.cards.length) * 100} label={t("Deck position")} />

      <button
        type="button"
        className="mt-5 block min-h-80 w-full rounded-xl text-left [perspective:1200px] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/25"
        aria-pressed={flipped}
        aria-label={flipped ? t("Showing explanation. Flip to concept.") : t("Showing concept. Flip to explanation.")}
        onClick={() => setFlipped((value) => !value)}
      >
        <span className="sr-only">{flipped ? card.definition : card.term}</span>
        <span className={`relative block min-h-80 w-full transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none ${flipped ? "[transform:rotateY(180deg)]" : ""}`} aria-hidden="true">
          <CardFace label={t("Concept")} content={card.term} hint={t("Tap to reveal explanation")} />
          <CardFace back label={t("Explanation")} content={card.definition} hint={t("Tap to show concept")} />
        </span>
      </button>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => move(index - 1)} disabled={index === 0}>{t("Previous")}</Button>
          <Button variant="secondary" onClick={() => move(index + 1)} disabled={index === deck.cards.length - 1}>{t("Next")}</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => mark("review")}>{t("Not remembered")}</Button>
          <Button onClick={() => mark("remembered")}>{t("Remembered")}</Button>
        </div>
      </div>
      <p className="mt-4 text-sm text-text-muted" aria-live="polite">
        {t("{{reviewed}} reviewed · {{remembered}} remembered", { reviewed, remembered })}
      </p>
    </section>
  );
}

function CardFace({ label, content, hint, back = false }: { label: string; content: string; hint: string; back?: boolean }) {
  return (
    <span className={`absolute inset-0 flex min-h-80 flex-col justify-between overflow-y-auto rounded-xl border p-6 shadow-card [backface-visibility:hidden] sm:p-10 ${back ? "border-primary/25 bg-primary-subtle [transform:rotateY(180deg)]" : "border-border bg-surface"}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</span>
      <span className={`my-8 block text-center font-semibold leading-relaxed text-text ${back ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{content}</span>
      <span className="text-center text-xs text-text-subtle">{hint}</span>
    </span>
  );
}
