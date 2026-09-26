"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PublicFooter, PublicHeader } from "@/components/public";
import { Badge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { LearningPathSummary, PageResponse } from "@/lib/learning-paths/types";

const capabilities = [
  ["Structured learning paths", "Follow lessons in a clear order instead of collecting disconnected tutorials."],
  ["Lessons and explanations", "Study focused technical content, examples, and the reasoning behind each answer."],
  ["Practice and assessment", "Use question banks, quizzes, and lesson assessments to check understanding."],
  ["Progress you can use", "Resume lessons, review quiz results, and see progress across joined learning paths."],
] as const;

const javaScope = [
  ["Java Fundamentals", "Java Overview", "Java Basics", "Java Execution"],
  ["Object-Oriented Programming", "Inheritance", "Polymorphism"],
] as const;

const resources = [
  "Oracle Java Documentation",
  "Spring Documentation",
  "PostgreSQL Documentation",
  "MDN Web Docs",
] as const;

export default function Home() {
  const { t } = useI18n();
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/learning-paths", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<PageResponse<LearningPathSummary>> : null)
      .then((page) => page && setPaths(page.content))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary-solid px-4 py-2 text-sm font-semibold text-white shadow-button transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        {t("Skip to main content")}
      </a>

      <PublicHeader />

      <main id="main-content" tabIndex={-1} className="public-snap-container">
        <section className="public-snap-section border-b border-border">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center lg:px-8 lg:py-24">
            <div>
              <Badge variant="info">{t("Java Backend Intern / Fresher preparation")}</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-text sm:text-5xl sm:leading-[1.08]">
                {t("Build the Java foundation for your first backend role.")}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">
                {t("Learn Java from fundamentals through object-oriented concepts, practice with focused questions, and prepare for Java Backend Intern and Fresher interviews.")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-base font-semibold text-white shadow-button transition-colors hover:border-primary-solid-hover hover:bg-primary-solid-hover focus-visible:ring-3 focus-visible:ring-focus/25" href="/login">
                  {t("Start learning")}
                </Link>
                <a className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-5 text-base font-semibold text-text shadow-button transition-colors hover:border-primary/40 hover:bg-primary-subtle hover:text-primary" href="#learning">
                  {t("Explore content")}
                </a>
              </div>
              <p className="mt-5 text-sm leading-6 text-text-subtle">
                {t("Designed for beginners, IT students, interns, and Java Backend Fresher candidates.")}
              </p>
            </div>

            <div className="border-l-4 border-primary bg-surface p-6 shadow-card sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("A focused learning cycle")}</p>
              <ol className="mt-6 space-y-5">
                {[
                  ["01", "Learn concepts in context"],
                  ["02", "Practice with four-option questions"],
                  ["03", "Review explanations and results"],
                  ["04", "Continue from saved progress"],
                ].map(([number, label]) => (
                  <li key={number} className="flex items-center gap-4">
                    <span className="font-mono text-sm font-semibold text-primary" aria-hidden="true">{number}</span>
                    <span className="text-sm font-medium text-text">{t(label)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="public-snap-section mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8" aria-labelledby="provides-title">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("What FresherPrep provides")}</p>
            <h2 id="provides-title" className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("One place to learn, practise, and review.")}</h2>
            <p className="mt-3 leading-7 text-text-muted">{t("Content is organized around a practical learning flow, without fake scores, rankings, or distracting gamification.")}</p>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {capabilities.map(([title, description], index) => (
              <article key={title} className="border-t border-border pt-5">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs font-semibold text-primary" aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h3 className="font-semibold text-text">{t(title)}</h3>
                    <p className="mt-2 text-sm leading-6 text-text-muted">{t(description)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="learning" className="public-snap-section border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Current learning scope")}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Start with the Java concepts that everything else depends on.")}</h2>
                <p className="mt-4 leading-7 text-text-muted">{t("The current curriculum focuses on Java fundamentals and object-oriented programming for Intern and Fresher preparation.")}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {paths.length ? paths.map((path) => (
                  <article key={path.id} className="rounded-lg border border-border bg-background p-5 shadow-card">
                    <Badge variant="success">{t("Published")}</Badge>
                    <h3 className="mt-3 font-semibold text-text">{path.name}</h3>
                    <p className="mt-2 text-sm text-text-muted">{path.technologyName}</p>
                    <Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline" href={`/learning-paths/${path.id}`}>{t("View learning path")}</Link>
                  </article>
                )) : javaScope.map((scope) => (
                  <article key={scope[0]} className="rounded-lg border border-border bg-background p-5 shadow-card">
                    <h3 className="font-semibold text-text">{t(scope[0])}</h3>
                    <ol className="mt-4 space-y-3">
                      {scope.slice(1).map((topic, index) => (
                        <li key={topic} className="flex items-center gap-3 text-sm text-text-muted">
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                          <span>{t(topic)}</span>
                          {index < scope.length - 2 ? <span className="ml-auto text-text-subtle" aria-hidden="true">↓</span> : null}
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="practice" className="public-snap-section mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Practice and quizzes")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Check understanding, then learn from the explanation.")}</h2>
            <p className="mt-4 leading-7 text-text-muted">{t("Take lesson assessments or broader quizzes, review correct and incorrect answers after submission, and use the result to decide what to revisit.")}</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("Practice features")}>
            {["Practice questions", "Quiz results", "Answer explanations", "Learning progress"].map((item) => (
              <li key={item} className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-text">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-strong" aria-hidden="true">✓</span>
                {t(item)}
              </li>
            ))}
          </ul>
        </section>

        <section className="public-snap-section border-y border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Trusted learning resources")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text">{t("Grounded in reliable technical documentation.")}</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">{t("Learning content is designed with reference to diverse, reputable documentation. FresherPrep does not claim affiliation with these publishers.")}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {resources.map((resource) => <li key={resource}><Badge>{resource}</Badge></li>)}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{t("Coming soon")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-text">{t("More ways to practise.")}</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">{t("These areas are planned for later and are not available yet.")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Badge variant="warning">{t("SQL Practice")}</Badge>
                <Badge variant="warning">{t("LeetCode / Coding Practice")}</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="public-snap-section mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">FresherPrep</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Ready to begin?")}</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-text-muted">{t("Build your Java foundation one focused lesson and assessment at a time.")}</p>
          <Link className="mt-7 inline-flex min-h-11 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-base font-semibold text-white shadow-button transition-colors hover:border-primary-solid-hover hover:bg-primary-solid-hover focus-visible:ring-3 focus-visible:ring-focus/25" href="/login">
            {t("Start learning")}
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
