"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  const { t } = useI18n();
  return <div className="mx-auto max-w-5xl"><Card><CardContent><p className="text-sm font-semibold text-text">{t(title)}</p><p className="mt-2 text-sm leading-6 text-text-muted">{t(description)}</p><Link href="/admin" className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-primary">{t("Return to admin overview")}</Link></CardContent></Card></div>;
}
