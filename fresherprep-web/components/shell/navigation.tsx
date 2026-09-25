"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

import {
  isNavigationItemActive,
  learningNavigation,
  type NavigationItem,
} from "./navigation-items";

interface LearningNavigationProps {
  items?: readonly NavigationItem[];
  onNavigate?: () => void;
  className?: string;
}

export function LearningNavigation({
  items = learningNavigation,
  onNavigate,
  className,
}: LearningNavigationProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t("Learning navigation")} className={className}>
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isNavigationItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20",
                  active &&
                    "border-primary/15 bg-primary-subtle font-semibold text-primary-strong",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full bg-border-strong transition-colors",
                    active ? "bg-primary" : "group-hover:bg-text-subtle",
                  )}
                />
                <span>{t(item.label)}</span>
                {active ? <span className="sr-only">{t("(current page)")}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
