"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavigationItemActive } from "@/components/shell";
import { cn } from "@/lib/cn";

import { adminNavigation } from "./navigation-items";

export function AdminNavigation({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className={className}>
      <ul className="space-y-1">
        {adminNavigation.map((item) => {
          const active = isNavigationItemActive(pathname, item.href);
          return (
            <li key={item.href}>
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
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
