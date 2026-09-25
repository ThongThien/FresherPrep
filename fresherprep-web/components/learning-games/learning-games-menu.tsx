"use client";

import Link from "next/link";

import { Badge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function LearningGamesMenu() {
  const { t } = useI18n();
  const games = [
    {
      href: "/games/flashcards",
      title: t("Flashcard"),
      description: t("Review lesson concepts one card at a time and mark what you remember."),
      icon: <FlashcardIcon />,
    },
    {
      href: "/games/matching",
      title: t("Matching"),
      description: t("Match lesson concepts with their explanations in a focused mini game."),
      icon: <MatchingIcon />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <p className="text-sm font-semibold text-primary">{t("Practice")}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text sm:text-3xl">{t("Learning Games")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
          {t("Use published lesson content for short, interactive review sessions.")}
        </p>
      </header>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {games.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="group rounded-lg border border-border bg-surface p-6 shadow-card transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-button focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-12 items-center justify-center rounded-lg border border-primary/15 bg-primary-subtle text-primary-strong" aria-hidden="true">{game.icon}</span>
              <Badge variant="info">{t("Available")}</Badge>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-text group-hover:text-primary">{game.title}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">{game.description}</p>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-primary">{t("Start game")} <span className="ml-1" aria-hidden="true">→</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FlashcardIcon() {
  return <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h5" /><path d="m15 16 1.5 1.5L19 15" /></svg>;
}

function MatchingIcon() {
  return <svg viewBox="0 0 24 24" className="size-6 fill-none stroke-current" strokeWidth="1.8"><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="13" width="7" height="7" rx="1.5" /><path d="m10 7.5 4 9M14 7.5h4M6 16.5h4" /></svg>;
}
