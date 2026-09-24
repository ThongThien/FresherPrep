import type { Metadata } from "next";

import { LearningPathListPage } from "@/components/learning-paths";

export const metadata: Metadata = {
  title: "Learning Paths",
  description: "Browse structured FresherPrep learning paths and continue your curriculum.",
};

export default function LearningPathsPage() {
  return <LearningPathListPage />;
}
