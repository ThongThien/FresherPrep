import type {
  LearningPathProgress,
  LessonProgress,
  PageResponse,
  QuizAttemptSummary,
  UserLearningPath,
} from "@/lib/dashboard/types";

export interface PathProgressEntry {
  membership: UserLearningPath;
  progress: LearningPathProgress | null;
}

export type ProgressIssue = "lessons" | "quizAttempts" | "pathProgress";

export interface ProgressData {
  paths: PageResponse<UserLearningPath>;
  pathEntries: PathProgressEntry[];
  lessons: PageResponse<LessonProgress>;
  quizAttempts: PageResponse<QuizAttemptSummary>;
  issues: ProgressIssue[];
}
