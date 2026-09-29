import type { Metadata } from "next";
import { SqlPracticeExercisePage } from "@/components/practice/sql-practice-exercise-page";

export const metadata: Metadata = { title: "SQL Exercise" };

export default async function SqlExerciseRoute(props: { params: Promise<{ exerciseId: string }> }) {
  const { exerciseId } = await props.params;
  return <SqlPracticeExercisePage exerciseId={exerciseId} />;
}

