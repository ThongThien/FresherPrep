import type { Metadata } from "next";

import { LessonLibraryPage } from "@/components/lessons";

export const metadata: Metadata = { title: "Lessons" };

export default function LessonsPage() {
  return <LessonLibraryPage />;
}
