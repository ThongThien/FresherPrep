"use client";

import { PublicFooter, PublicHeader, PublicHome } from "@/components/public";

import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-background lg:flex lg:h-dvh lg:flex-col lg:overflow-hidden">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-md bg-primary-solid px-4 py-2 text-sm font-semibold text-white shadow-button transition-transform focus:translate-y-0 motion-reduce:transition-none"
      >
        {t("Skip to main content")}
      </a>
      <PublicHeader />
      <PublicHome />
      <PublicFooter />
    </div>
  );
}
