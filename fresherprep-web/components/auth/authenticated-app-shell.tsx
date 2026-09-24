"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/shell";
import { Button, Feedback } from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/auth/types";

import { CurrentUserProvider } from "./current-user-context";

interface AuthenticatedAppShellProps {
  children: ReactNode;
}

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "error"; message: string };

export function AuthenticatedAppShell({ children }: AuthenticatedAppShellProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionRequest, setSessionRequest] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (!response.ok) {
          const error = await readApiError(response);
          setSession({ status: "error", message: error.message });
          return;
        }

        const payload = (await response.json()) as { user?: CurrentUser };
        if (!payload.user) {
          setSession({ status: "error", message: "The current account could not be loaded." });
          return;
        }
        setSession({ status: "authenticated", user: payload.user });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession({
          status: "error",
          message: "Unable to verify your account. Check your connection and try again.",
        });
      });

    return () => controller.abort();
  }, [pathname, sessionRequest]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  const userState =
    session.status === "authenticated"
      ? {
          status: "authenticated" as const,
          displayName: session.user.displayName,
          email: session.user.email,
        }
      : session.status === "error"
        ? ({ status: "error" } as const)
        : ({ status: "loading" } as const);

  return (
    <AppShell userState={userState} onLogout={logout} logoutPending={loggingOut}>
      {session.status === "authenticated" ? (
        <CurrentUserProvider user={session.user}>{children}</CurrentUserProvider>
      ) : null}
      {session.status === "loading" ? <WorkspaceLoading /> : null}
      {session.status === "error" ? (
        <div className="mx-auto max-w-xl py-12">
          <Feedback tone="error" title="Account unavailable">
            {session.message}
          </Feedback>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setSession({ status: "loading" });
              setSessionRequest((current) => current + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}
    </AppShell>
  );
}

function WorkspaceLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-5 py-4 motion-reduce:animate-none" role="status">
      <span className="sr-only">Loading learning workspace</span>
      <div className="h-7 w-52 rounded bg-surface-strong" />
      <div className="h-4 w-full max-w-xl rounded bg-surface-strong" />
      <div className="mt-8 h-36 rounded-lg border border-border bg-surface" />
    </div>
  );
}
