export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface LearningPathSummary {
  id: string;
  name: string;
  slug: string;
  technologyId: string;
  technologyName: string;
  status: "PUBLISHED" | string;
  createdAt: string;
  updatedAt: string;
}

export interface UserLearningPath {
  id: string;
  joinedAt: string;
  learningPath: LearningPathSummary;
}

export type AssessmentProgressStatus =
  | "NOT_REQUIRED"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "FAILED"
  | "PASSED";

export interface LearningPathLessonProgress {
  itemId: string;
  lessonId: string;
  lessonTitle: string;
  displayOrder: number;
  required: boolean;
  weight: number;
  readingQualified: boolean;
  assessmentRequired: boolean;
  assessmentQuizId: string | null;
  assessmentStatus: AssessmentProgressStatus;
  completed: boolean;
  locked: boolean;
  blockedByLessonId: string | null;
  blockedByLessonTitle: string | null;
}

export interface LearningPathProgress {
  learningPathId: string;
  learningPathName: string;
  totalItems: number;
  completedItems: number;
  requiredItems: number;
  completedRequiredItems: number;
  totalRequiredWeight: number;
  completedRequiredWeight: number;
  progressPercentage: number;
  completed: boolean;
  lessons: LearningPathLessonProgress[];
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  activeSeconds: number;
  maxScrollPercent: number;
  lastViewedAt: string;
  readQualified: boolean;
  readQualifiedAt: string | null;
  assessmentRequired: boolean;
  assessmentQuizId: string | null;
  assessmentStatus: AssessmentProgressStatus;
  assessmentPassPercentage: number | null;
  assessmentScorePercentage: number | null;
  completed: boolean;
  version: number;
}

export interface QuizAttemptSummary {
  id: string;
  quizId: string;
  quizTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED" | string;
  scorePercentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}

export type DashboardSection = "paths" | "pathProgress" | "lessons" | "quizAttempts";

export interface AchievementProgress {
  completedLessons: number | null;
  submittedQuizzes: number | null;
  passedQuizzes: number | null;
}

export interface DashboardData {
  paths: PageResponse<UserLearningPath>;
  latestPathProgress: LearningPathProgress | null;
  lessonProgress: PageResponse<LessonProgress>;
  quizAttempts: PageResponse<QuizAttemptSummary>;
  achievementProgress: AchievementProgress;
  issues: DashboardSection[];
}
