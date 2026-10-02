"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { CurrentUserProvider } from "@/components/auth/current-user-context";
import { Button, Feedback, LoadingState } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/auth/types";
import { useI18n } from "@/lib/i18n";
import { clearAllProgressCaches } from "@/lib/progress/cache";

import { AdminShell } from "./admin-shell";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "error"; message: string };

export function AdminAuthenticatedShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [requestKey, setRequestKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=" + encodeURIComponent(initialPathname));
          return;
        }
        if (!response.ok) {
          setSession({ status: "error", message: (await readApiError(response)).message });
          return;
        }
        const payload = await response.json() as { user?: CurrentUser };
        if (!payload.user) {
          setSession({ status: "error", message: t("The current account could not be loaded.") });
          return;
        }
        if (payload.user.role !== "ADMIN") {
          window.location.replace("/dashboard");
          return;
        }
        setSession({ status: "authenticated", user: payload.user });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({ status: "error", message: t("Unable to verify your admin account. Check your connection and try again.") });
      });
    return () => controller.abort();
  }, [initialPathname, requestKey, t]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { clearAllProgressCaches(); window.location.replace("/login"); }
  }

  if (session.status === "loading") return <AdminGateLoading />;
  if (session.status === "error") {
    return <div className="min-h-dvh bg-background px-4 py-16"><div className="mx-auto max-w-xl"><Feedback tone="error" title={t("Admin workspace unavailable")}>{session.message}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setSession({ status: "loading" }); setRequestKey((value) => value + 1); }}>{t("Try again")}</Button></div></div>;
  }

  const userState = { status: "authenticated" as const, displayName: session.user.displayName, email: session.user.email, role: session.user.role };
  return <CurrentUserProvider user={session.user}><AdminShell userState={userState} onLogout={logout} logoutPending={loggingOut}>{children}</AdminShell></CurrentUserProvider>;
}

function AdminGateLoading() {
  const { t } = useI18n();
  return <div className="min-h-dvh bg-background"><div className="h-16 border-b border-border bg-surface" /><LoadingState className="mx-auto mt-10 max-w-3xl" title={t("Verifying admin access...")} description={t("Please wait a moment.")} /></div>;
}
