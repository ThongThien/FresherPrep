import type { Metadata } from "next";
import { QuizAttemptPage } from "@/components/quizzes";

export const metadata: Metadata = { title: "Quiz Attempt" };

export default async function AttemptPage(props: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const { quizId, attemptId } = await props.params;
  return <QuizAttemptPage quizId={quizId} attemptId={attemptId} />;
}
