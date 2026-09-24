export type ContentStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export interface AdminMetric {
  key: "knowledge" | "learningPaths" | "lessons" | "questions" | "quizzes";
  label: string;
  total: number;
}

export interface AdminDashboardData {
  metrics: AdminMetric[];
  statusTotals: Record<ContentStatus, number> | null;
  unavailable: string[];
}
