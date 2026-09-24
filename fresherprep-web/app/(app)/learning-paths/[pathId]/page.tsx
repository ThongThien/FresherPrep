import type { Metadata } from "next";

import { LearningPathDetailPage } from "@/components/learning-paths";

export const metadata: Metadata = {
  title: "Learning Path",
};

export default async function LearningPathPage(
  props: { params: Promise<{ pathId: string }> },
) {
  const { pathId } = await props.params;
  return <LearningPathDetailPage pathId={pathId} />;
}
