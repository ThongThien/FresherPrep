"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "./confirm-dialog";

export function NavigationConfirm({
  enabled,
  title,
  description,
  confirmLabel,
  cancelLabel,
}: {
  enabled: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const router = useRouter();
  const [destination, setDestination] = useState<string>();
  const bypassUnload = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (bypassUnload.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) return;

      const next = new URL(anchor.href, window.location.href);
      const current = new URL(window.location.href);
      if (!["http:", "https:"].includes(next.protocol)) return;
      if (
        next.origin === current.origin &&
        next.pathname === current.pathname &&
        next.search === current.search
      ) return;

      event.preventDefault();
      event.stopPropagation();
      setDestination(next.href);
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", interceptLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", interceptLink, true);
    };
  }, [enabled]);

  function leave() {
    if (!destination) return;
    const next = new URL(destination);
    setDestination(undefined);
    if (next.origin === window.location.origin) {
      router.push(next.pathname + next.search + next.hash);
      return;
    }
    bypassUnload.current = true;
    window.location.assign(next.href);
  }

  return (
    <ConfirmDialog
      open={Boolean(destination)}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={leave}
      onClose={() => setDestination(undefined)}
    />
  );
}
