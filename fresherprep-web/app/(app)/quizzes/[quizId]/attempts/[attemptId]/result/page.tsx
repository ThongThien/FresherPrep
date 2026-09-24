import type { Metadata } from "next";
import { QuizResultPage } from "@/components/quizzes";

export const metadata: Metadata = { title: "Quiz Result" };

export default async function ResultPage(props: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const { quizId, attemptId } = await props.params;
  return <QuizResultPage quizId={quizId} attemptId={attemptId} />;
}
