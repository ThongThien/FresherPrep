import type { Metadata } from "next";

import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Continue learning and review your FresherPrep progress.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
