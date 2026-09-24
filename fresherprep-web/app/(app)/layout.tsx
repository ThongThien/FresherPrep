import type { ReactNode } from "react";

import { AuthenticatedAppShell } from "@/components/auth";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
