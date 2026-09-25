import type { Metadata } from "next";

import { FlashcardGame } from "@/components/learning-games";

export const metadata: Metadata = { title: "Flashcard" };

export default function Page() {
  return <FlashcardGame />;
}
