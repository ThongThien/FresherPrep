"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LanguageSwitcher, ThemeToggle } from "@/components/shell";
import { useI18n } from "@/lib/i18n";

export function PublicHeader() {
  const { t } = useI18n();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return <header className="border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90"><div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-2.5 rounded-sm font-semibold tracking-tight text-text focus-visible:ring-3 focus-visible:ring-focus/20" aria-label={t("FresherPrep home")}><span className="flex size-8 items-center justify-center rounded-md bg-primary-solid text-xs font-bold text-white" aria-hidden="true">FP</span><span className="hidden min-[360px]:inline">FresherPrep</span></Link><div className="ml-auto flex items-center gap-2"><LanguageSwitcher /><ThemeToggle /><Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border-strong bg-surface px-3 text-sm font-semibold text-text shadow-button transition-colors hover:border-primary/40 hover:bg-primary-subtle hover:text-primary" href={authenticated ? "/dashboard" : "/login"}>{authenticated ? t("Enter learning") : t("Sign in")}</Link></div></div></header>;
}
