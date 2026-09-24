import type { Metadata } from "next";
import { LearningProgressPage } from "@/components/progress";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return <LearningProgressPage />;
}
