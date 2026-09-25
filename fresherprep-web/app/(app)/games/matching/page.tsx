import type { Metadata } from "next";

import { MatchingGame } from "@/components/learning-games";

export const metadata: Metadata = { title: "Matching" };

export default function Page() {
  return <MatchingGame />;
}
