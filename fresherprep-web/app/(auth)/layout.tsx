import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
            aria-label="FresherPrep home"
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-md bg-primary text-xs font-bold tracking-tight text-white"
            >
              FP
            </span>
            <span className="text-base font-semibold tracking-tight text-text">FresherPrep</span>
          </Link>
          <p className="ml-auto hidden text-sm text-text-muted sm:block">
            Java backend learning, focused and structured.
          </p>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-text-subtle">
        Build practical knowledge for your first backend role.
      </footer>
    </div>
  );
}
