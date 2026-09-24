"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { CurrentUserProvider } from "@/components/auth/current-user-context";
import { Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/auth/types";

import { AdminShell } from "./admin-shell";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "error"; message: string };

export function AdminAuthenticatedShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [requestKey, setRequestKey] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace("/login?next=" + encodeURIComponent(pathname));
          return;
        }
        if (!response.ok) {
          setSession({ status: "error", message: (await readApiError(response)).message });
          return;
        }
        const payload = await response.json() as { user?: CurrentUser };
        if (!payload.user) {
          setSession({ status: "error", message: "The current account could not be loaded." });
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
        setSession({ status: "error", message: "Unable to verify your admin account. Check your connection and try again." });
      });
    return () => controller.abort();
  }, [pathname, requestKey]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally { window.location.replace("/login"); }
  }

  if (session.status === "loading") return <AdminGateLoading />;
  if (session.status === "error") {
    return <div className="min-h-dvh bg-background px-4 py-16"><div className="mx-auto max-w-xl"><Feedback tone="error" title="Admin workspace unavailable">{session.message}</Feedback><Button className="mt-4" variant="secondary" onClick={() => { setSession({ status: "loading" }); setRequestKey((value) => value + 1); }}>Try again</Button></div></div>;
  }

  const userState = { status: "authenticated" as const, displayName: session.user.displayName, email: session.user.email, role: session.user.role };
  return <CurrentUserProvider user={session.user}><AdminShell userState={userState} onLogout={logout} logoutPending={loggingOut}>{children}</AdminShell></CurrentUserProvider>;
}

function AdminGateLoading() {
  return <div className="min-h-dvh bg-background" role="status"><span className="sr-only">Verifying admin access</span><div className="h-16 border-b border-border bg-surface" /><div className="mx-auto max-w-4xl animate-pulse space-y-5 px-4 py-10 motion-reduce:animate-none"><div className="h-8 w-52 rounded bg-surface-strong" /><div className="h-32 rounded-lg bg-surface" /></div></div>;
}
