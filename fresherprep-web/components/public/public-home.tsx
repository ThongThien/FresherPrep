"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { LearningPathSummary, PageResponse } from "@/lib/learning-paths/types";

const sections = [
  ["introduction", "Introduction"],
  ["roadmap", "Java roadmap"],
  ["experience", "Learning experience"],
  ["practice", "Practice and quizzes"],
  ["resources", "Learning resources"],
  ["coming-soon", "Coming soon"],
  ["get-started", "Get started"],
] as const;

const javaScope = [
  ["Java Fundamentals", "Java Overview", "Java Basics", "Java Execution"],
  ["Object-Oriented Programming", "Inheritance", "Polymorphism"],
] as const;

const capabilities = [
  ["Structured learning paths", "Follow lessons in a clear order instead of collecting disconnected tutorials."],
  ["Lessons and explanations", "Study focused technical content, examples, and the reasoning behind each answer."],
  ["Practice and assessment", "Use question banks, quizzes, and lesson assessments to check understanding."],
  ["Progress you can use", "Resume lessons, review quiz results, and see progress across joined learning paths."],
] as const;

const resources = ["Oracle Java Documentation", "Spring Documentation", "PostgreSQL Documentation", "MDN Web Docs"] as const;

export function PublicHome() {
  const { t } = useI18n();
  const scrollRoot = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState("introduction");
  const [paths, setPaths] = useState<LearningPathSummary[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/learning-paths", { signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<PageResponse<LearningPathSummary>> : null)
      .then((page) => page && setPaths(page.content))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const root = scrollRoot.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { root, threshold: [0.35, 0.6] },
    );
    sections.forEach(([id]) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <nav className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block" aria-label={t("Home sections")}>
        <ol className="space-y-3 rounded-full border border-border bg-surface/90 px-2.5 py-3 shadow-card backdrop-blur-sm">
          {sections.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="group flex size-6 items-center justify-center" aria-label={t(label)} aria-current={activeSection === id ? "step" : undefined}>
                <span className={`block rounded-full transition-[width,height,background-color] motion-reduce:transition-none ${activeSection === id ? "size-2.5 bg-primary" : "size-1.5 bg-border-strong group-hover:bg-primary"}`} />
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <main id="main-content" ref={scrollRoot} tabIndex={-1} className="public-snap-container">
        <HomeSection id="introduction" className="border-b border-border">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-center">
            <div>
              <Badge variant="info">{t("Java Backend Intern / Fresher preparation")}</Badge>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-text sm:text-5xl sm:leading-[1.08]">{t("Build the Java foundation for your first backend role.")}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-text-muted sm:text-lg">{t("Learn Java from fundamentals through object-oriented concepts, practice with focused questions, and prepare for Java Backend Intern and Fresher interviews.")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryLink href="/login">{t("Start learning")}</PrimaryLink>
                <SectionLink href="#roadmap">{t("Explore content")}</SectionLink>
              </div>
              <p className="mt-5 text-sm leading-6 text-text-subtle">{t("Designed for beginners, IT students, interns, and Java Backend Fresher candidates.")}</p>
            </div>
            <div className="border-l-4 border-primary bg-surface p-6 shadow-card sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("A focused learning cycle")}</p>
              <ol className="mt-6 space-y-5">
                {["Learn concepts in context", "Practice with four-option questions", "Review explanations and results", "Continue from saved progress"].map((label, index) => (
                  <li key={label} className="flex items-center gap-4"><span className="font-mono text-sm font-semibold text-primary" aria-hidden="true">0{index + 1}</span><span className="text-sm font-medium text-text">{t(label)}</span></li>
                ))}
              </ol>
            </div>
          </div>
        </HomeSection>

        <HomeSection id="roadmap" className="border-b border-border bg-surface">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Java roadmap")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Start with the Java concepts that everything else depends on.")}</h2>
              <p className="mt-4 leading-7 text-text-muted">{t("The current curriculum focuses on Java fundamentals and object-oriented programming for Intern and Fresher preparation.")}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {paths.length ? paths.map((path) => (
                <article key={path.id} className="rounded-lg border border-border bg-background p-5 shadow-card">
                  <Badge variant="success">{t("Published")}</Badge><h3 className="mt-3 font-semibold text-text">{path.name}</h3><p className="mt-2 text-sm text-text-muted">{path.technologyName}</p>
                  <Link className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline" href={`/learning-paths/${path.id}`}>{t("View learning path")}</Link>
                </article>
              )) : javaScope.map((scope) => (
                <article key={scope[0]} className="rounded-lg border border-border bg-background p-5 shadow-card">
                  <h3 className="font-semibold text-text">{t(scope[0])}</h3>
                  <ol className="mt-4 space-y-3">{scope.slice(1).map((topic) => <li key={topic} className="flex items-center gap-3 text-sm text-text-muted"><span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span>{t(topic)}</span></li>)}</ol>
                </article>
              ))}
            </div>
          </div>
        </HomeSection>

        <HomeSection id="experience">
          <div className="w-full">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Learning experience")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("One place to learn, practise, and review.")}</h2><p className="mt-3 leading-7 text-text-muted">{t("Content is organized around a practical learning flow, without fake scores, rankings, or distracting gamification.")}</p></div>
            <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2">{capabilities.map(([title, description], index) => <article key={title} className="border-t border-border pt-5"><div className="flex items-start gap-4"><span className="font-mono text-xs font-semibold text-primary" aria-hidden="true">0{index + 1}</span><div><h3 className="font-semibold text-text">{t(title)}</h3><p className="mt-2 text-sm leading-6 text-text-muted">{t(description)}</p></div></div></article>)}</div>
          </div>
        </HomeSection>

        <HomeSection id="practice" className="border-y border-border bg-surface">
          <div className="grid w-full gap-10 lg:grid-cols-2 lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Practice and quizzes")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Check understanding, then learn from the explanation.")}</h2><p className="mt-4 leading-7 text-text-muted">{t("Take lesson assessments or broader quizzes, review correct and incorrect answers after submission, and use the result to decide what to revisit.")}</p></div>
            <ul className="grid gap-3 sm:grid-cols-2" aria-label={t("Practice features")}>{["Practice questions", "Quiz results", "Answer explanations", "Learning progress"].map((item) => <li key={item} className="flex min-h-14 items-center gap-3 rounded-md border border-border bg-background px-4 text-sm font-semibold text-text"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success-strong" aria-hidden="true">✓</span>{t(item)}</li>)}</ul>
          </div>
        </HomeSection>

        <HomeSection id="resources">
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Learning resources")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Grounded in reliable technical documentation.")}</h2><p className="mt-4 leading-7 text-text-muted">{t("Learning content is designed with reference to diverse, reputable documentation. FresherPrep does not claim affiliation with these publishers.")}</p></div>
            <ul className="grid gap-3 sm:grid-cols-2">{resources.map((resource) => <li key={resource} className="border-t border-border py-5 text-sm font-semibold text-text">{resource}</li>)}</ul>
          </div>
        </HomeSection>

        <HomeSection id="coming-soon" className="border-y border-border bg-surface">
          <div className="w-full text-center"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-subtle">{t("Coming soon")}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("More ways to practise.")}</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-text-muted">{t("These areas are planned for later and are not available yet.")}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Badge variant="warning">{t("SQL Practice")}</Badge><Badge variant="warning">{t("LeetCode / Coding Practice")}</Badge></div></div>
        </HomeSection>

        <HomeSection id="get-started" className="public-snap-section-final">
          <div className="flex flex-1 items-center justify-center py-16 text-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">FresherPrep</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">{t("Ready to begin?")}</h2><p className="mx-auto mt-3 max-w-xl leading-7 text-text-muted">{t("Build your Java foundation one focused lesson and assessment at a time.")}</p><PrimaryLink className="mt-7" href="/login">{t("Start learning")}</PrimaryLink></div>
          </div>
        </HomeSection>
      </main>
    </>
  );
}

function HomeSection({ id, className = "", children }: { id: string; className?: string; children: React.ReactNode }) {
  return <section id={id} className={`public-snap-section scroll-mt-16 ${className}`}><div className="mx-auto flex w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">{children}</div></section>;
}

function PrimaryLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  return <Link className={`inline-flex min-h-11 items-center justify-center rounded-md border border-primary-solid bg-primary-solid px-5 text-base font-semibold text-white shadow-button transition-colors hover:border-primary-solid-hover hover:bg-primary-solid-hover focus-visible:ring-3 focus-visible:ring-focus/25 ${className}`} href={href}>{children}</Link>;
}

function SectionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-5 text-base font-semibold text-text shadow-button transition-colors hover:border-primary/40 hover:bg-primary-subtle hover:text-primary" href={href}>{children}</a>;
}
