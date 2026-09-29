import type { Metadata } from "next";
import { SqlPracticeListPage } from "@/components/practice/sql-practice-list-page";

export const metadata: Metadata = { title: "SQL Practice" };

export default function PracticePage() {
  return <SqlPracticeListPage />;
}

