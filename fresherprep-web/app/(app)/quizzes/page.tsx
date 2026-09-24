import type { Metadata } from "next";
import { QuizListPage } from "@/components/quizzes";

export const metadata: Metadata = { title: "Quizzes" };

export default function QuizzesPage() {
  return <QuizListPage />;
}
