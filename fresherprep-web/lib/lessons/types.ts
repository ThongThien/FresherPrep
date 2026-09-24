export interface LessonSummary {
  id: string;
  subtopicId: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | string;
  displayOrder: number;
  minimumReadSeconds: number;
  requiredScrollPercent: number;
}

export interface LessonDetail extends LessonSummary {
  content: string;
  createdAt: string;
  updatedAt: string;
  prerequisites: LessonSummary[];
}

export type AssessmentProgressStatus = "NOT_REQUIRED" | "NOT_STARTED" | "IN_PROGRESS" | "FAILED" | "PASSED";

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
  completed: boolean;
  version: number;
}

export interface LessonPathContext {
  id: string;
  name: string;
  previous: LessonSummary | null;
  next: LessonSummary | null;
}

export interface LessonDetailData {
  lesson: LessonDetail;
  pathContext: LessonPathContext | null;
}
