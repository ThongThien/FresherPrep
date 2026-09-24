import type { ReactNode } from "react";

import { AdminAuthenticatedShell } from "@/components/admin";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthenticatedShell>{children}</AdminAuthenticatedShell>;
}
