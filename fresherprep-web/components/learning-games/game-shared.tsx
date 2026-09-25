"use client";

import Link from "next/link";

import { Button, Feedback, Select } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { LearningGameDeckSummary } from "@/lib/learning-games/types";

export function GameHeader({ title, description }: { title: string; description: string }) {
  const { t } = useI18n();
  return (
    <header>
      <Link href="/games" className="inline-flex min-h-10 items-center rounded-sm text-sm font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20">
        <span aria-hidden="true">←</span>&nbsp; {t("Learning Games")}
      </Link>
      <p className="mt-5 text-sm font-semibold text-primary">{t("Practice mode")}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">{description}</p>
    </header>
  );
}

export function DeckPicker({ decks, value, onChange }: {
  decks: LearningGameDeckSummary[];
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mt-6 max-w-xl rounded-lg border border-border bg-surface p-4 shadow-card sm:p-5">
      <label htmlFor="game-deck" className="mb-2 block text-sm font-semibold text-text">{t("Learning path deck")}</label>
      <Select id="game-deck" value={value} onChange={(event) => onChange(event.target.value)}>
        {decks.map((deck) => <option key={deck.id} value={deck.id}>{deck.name} · {deck.technologyName}</option>)}
      </Select>
      <p className="mt-2 text-xs leading-5 text-text-muted">{t("Cards are generated from published lesson titles and content.")}</p>
    </div>
  );
}

export function GameLoading() {
  const { t } = useI18n();
  return (
    <div className="mt-8 animate-pulse space-y-4 motion-reduce:animate-none" role="status">
      <span className="sr-only">{t("Loading game")}</span>
      <div className="h-5 w-40 rounded bg-surface-strong" />
      <div className="h-72 rounded-xl border border-border bg-surface" />
    </div>
  );
}

export function GameError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-8 max-w-2xl">
      <Feedback tone="error" title={t("Game unavailable")}>{message}</Feedback>
      <Button className="mt-4" variant="secondary" onClick={onRetry}>{t("Try again")}</Button>
    </div>
  );
}

export function NoGameDecks({ emptyCards = false }: { emptyCards?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="mt-8 rounded-lg border border-dashed border-border-strong bg-surface px-5 py-10 text-center">
      <h2 className="font-semibold text-text">{emptyCards ? t("This deck has no usable cards") : t("No learning game decks available")}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-text-muted">
        {emptyCards
          ? t("Published lessons need a title and content before they can be used in a game.")
          : t("Published learning paths with lessons will appear here.")}
      </p>
      <Link href="/learning-paths" className="mt-4 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold text-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20">
        {t("Browse learning paths")}
      </Link>
    </div>
  );
}
