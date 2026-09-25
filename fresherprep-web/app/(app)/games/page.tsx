import type { Metadata } from "next";

import { LearningGamesMenu } from "@/components/learning-games";

export const metadata: Metadata = { title: "Learning Games" };

export default function Page() {
  return <LearningGamesMenu />;
}
