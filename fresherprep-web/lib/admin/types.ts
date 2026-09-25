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

export type KnowledgeNodeType = "TECHNOLOGY" | "CATEGORY" | "TOPIC" | "SUBTOPIC";

export interface KnowledgeNode {
  id: string;
  parentId: string | null;
  type: KnowledgeNodeType;
  name: string;
  slug: string;
  displayOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface LessonSummary {
  id: string;
  subtopicId: string;
  title: string;
  slug: string;
  status: ContentStatus;
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

export interface LearningPathSummary {
  id: string;
  name: string;
  slug: string;
  technologyId: string;
  technologyName: string;
  status: ContentStatus;
}

export interface LearningPathItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  lessonStatus: ContentStatus;
  displayOrder: number;
  required: boolean;
  weight: number;
}

export interface LearningPathDetail extends LearningPathSummary {
  createdAt: string;
  updatedAt: string;
  items: LearningPathItem[];
}

export interface LessonAssessment {
  id: string;
  lessonId: string;
  quizId: string;
  quizCode: string;
  quizTitle: string;
  quizStatus: ContentStatus;
  passPercentage: number;
}

export interface QuizSummary {
  id: string;
  code: string;
  title: string;
  status: ContentStatus;
  passPercentage: number;
}

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionLanguage = "VI" | "EN";
export type QuestionCategory = "TECHNICAL" | "GRAMMAR" | "VOCABULARY" | "TOEIC";
export type QuizType = "LESSON" | "TOPIC" | "MIXED" | "READINESS";
export type QuizSelectionMode = "FIXED" | "RULE_BASED";
export type QuizCategory = "TECHNICAL" | "GRAMMAR" | "VOCABULARY" | "TOEIC" | "MIXED";

export interface Question {
  id: string;
  subtopicId: string;
  code: string;
  difficulty: Difficulty;
  language: QuestionLanguage;
  category: QuestionCategory;
  status: ContentStatus;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  id: string;
  position: number;
  content: string;
  correct: boolean;
  explanation: string;
}

export interface QuestionVersion {
  id: string;
  questionId: string;
  versionNumber: number;
  content: string;
  explanation: string;
  createdAt: string;
  options: QuestionOption[];
}

export interface QuizFixedQuestion {
  id: string;
  questionId: string;
  questionCode: string;
  position: number;
}

export interface QuizRule {
  id: string;
  knowledgeNodeId: string;
  difficulty: Difficulty | null;
  questionCount: number;
}

export interface QuizDetail {
  id: string;
  code: string;
  title: string;
  type: QuizType;
  selectionMode: QuizSelectionMode;
  passPercentage: number;
  language: QuestionLanguage;
  category: QuizCategory;
  maximumScore: number;
  durationSeconds: number | null;
  passingScore: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  fixedQuestions: QuizFixedQuestion[];
  rules: QuizRule[];
}
