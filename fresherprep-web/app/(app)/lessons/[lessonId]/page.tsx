import type { Metadata } from "next";
import { LessonPage } from "@/components/lessons";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonRoute(props: { params: Promise<{ lessonId: string }>; searchParams: Promise<{ pathId?: string | string[] }> }) {
  const [{ lessonId }, searchParams] = await Promise.all([props.params, props.searchParams]);
  return <LessonPage lessonId={lessonId} pathId={typeof searchParams.pathId === "string" ? searchParams.pathId : undefined} />;
}
