import Link from "next/link";
import type { ReactNode } from "react";

interface AuthFormShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternateText: string;
  alternateHref: string;
  alternateLabel: string;
}

export function AuthFormShell({
  eyebrow,
  title,
  description,
  children,
  alternateText,
  alternateHref,
  alternateLabel,
}: AuthFormShellProps) {
  return (
    <section className="w-full max-w-md" aria-labelledby="auth-title">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        <h1 id="auth-title" className="mt-3 text-3xl font-semibold tracking-tight text-text">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">{description}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
        {children}
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        {alternateText}{" "}
        <Link
          href={alternateHref}
          className="font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:rounded-sm"
        >
          {alternateLabel}
        </Link>
      </p>
    </section>
  );
}
