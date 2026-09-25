"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavigationItemActive } from "@/components/shell";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

import { adminNavigation } from "./navigation-items";

export function AdminNavigation({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t("Admin navigation")} className={className}>
      <ul className="space-y-1">
        {adminNavigation.map((item) => {
          const active = !item.disabled && isNavigationItemActive(pathname, item.href);
          return (
            <li key={item.href}>
              {item.disabled ? (
                <span
                  aria-disabled="true"
                  className="group flex min-h-11 cursor-not-allowed items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-text-subtle"
                  title={t("Not available yet")}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-border" />
                  <span>{t(item.label)}</span>
                  <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wide">{t("Soon")}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20",
                    active && "border-primary/15 bg-primary-subtle font-semibold text-primary-strong",
                  )}
                >
                  <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-border-strong", active && "bg-primary")} />
                  {t(item.label)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
