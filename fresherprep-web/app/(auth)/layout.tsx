import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "@/components/public";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PublicHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
