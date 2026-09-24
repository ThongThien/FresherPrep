import type { Metadata } from "next";
import { QuizStartPage } from "@/components/quizzes";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage(props: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await props.params;
  return <QuizStartPage quizId={quizId} />;
}
