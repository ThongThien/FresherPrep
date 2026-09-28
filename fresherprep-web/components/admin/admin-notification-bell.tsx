"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { AdminNotification, PageResponse } from "@/lib/comments/types";
import { useI18n } from "@/lib/i18n";

export function AdminNotificationBell() {
  const router = useRouter();
  const { locale, t } = useI18n();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      try {
        const response = await fetch("/api/admin/notifications/unread-count");
        if (!response.ok) return;
        const value = await response.json() as { unreadCount: number };
        if (active) setCount(value.unreadCount);
      } catch { /* Count polling is intentionally silent. */ }
    };
    void loadCount();
    const interval = window.setInterval(() => void loadCount(), 60000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/admin/notifications?page=0&size=10&sort=createdAt,desc");
      if (!response.ok) throw new Error((await readApiError(response)).message);
      setItems((await response.json() as PageResponse<AdminNotification>).content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("Unable to load notifications."));
    } finally { setLoading(false); }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) await loadNotifications();
  }

  async function visit(notification: AdminNotification) {
    if (!notification.readAt) {
      const response = await fetch(`/api/admin/notifications/${encodeURIComponent(notification.id)}/read`, { method: "POST" });
      if (response.ok) {
        const updated = await response.json() as AdminNotification;
        setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
        setCount((value) => Math.max(0, value - 1));
      }
    }
    setOpen(false);
    const base = notification.targetType === "LESSON" ? "/lessons/" : "/quizzes/";
    router.push(`${base}${notification.targetId}#comment-${notification.commentId}`);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button type="button" onClick={() => void toggle()} className="relative inline-flex size-10 items-center justify-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text focus-visible:ring-3 focus-visible:ring-focus/20" aria-label={t("Admin notifications, {{count}} unread", { count })} aria-expanded={open} aria-haspopup="menu">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
        {count > 0 ? <span className="absolute right-0 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">{count > 99 ? "99+" : count}</span> : null}
      </button>
      {open ? <div role="menu" aria-label={t("Notifications")} className="absolute right-0 z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <div className="border-b border-border px-4 py-3"><p className="font-semibold text-text">{t("Notifications")}</p><p className="mt-0.5 text-xs text-text-muted">{t("New lesson and quiz comments")}</p></div>
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
          {loading ? <p className="px-4 py-6 text-center text-sm text-text-muted" role="status">{t("Loading notifications...")}</p> : null}
          {error && !loading ? <div className="px-4 py-5"><p className="text-sm text-danger-strong">{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void loadNotifications()}>{t("Try again")}</Button></div> : null}
          {!loading && !error && items.length === 0 ? <p className="px-4 py-6 text-center text-sm text-text-muted">{t("No comment notifications yet.")}</p> : null}
          {!loading && !error ? items.map((item) => <button key={item.id} type="button" role="menuitem" onClick={() => void visit(item)} className="block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-surface-muted focus-visible:bg-primary-subtle focus-visible:outline-none">
            <span className="flex items-start gap-3"><span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${item.readAt ? "bg-border-strong" : "bg-primary-solid"}`} /><span className="min-w-0"><span className="block text-sm font-semibold text-text">{t("{{author}} commented on {{title}}", { author: item.authorName, title: item.targetTitle })}</span><span className="mt-1 block truncate text-xs text-text-muted">{item.commentContent}</span><span className="mt-1 block text-xs text-text-subtle">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</span></span></span>
          </button>) : null}
        </div>
      </div> : null}
    </div>
  );
}
