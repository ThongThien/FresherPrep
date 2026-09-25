"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  const { t } = useI18n();
  return <div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t(title)}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{t(description)}</p><Card className="mt-8"><CardContent><p className="text-sm font-semibold text-text">{t("Management foundation ready")}</p><p className="mt-2 text-sm leading-6 text-text-muted">{t("Detailed CRUD workflows are intentionally reserved for the next admin implementation job.")}</p><Link href="/admin" className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary">{t("Return to admin overview")}</Link></CardContent></Card></div>;
}
