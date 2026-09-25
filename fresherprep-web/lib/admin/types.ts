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

export type UserRole = "USER" | "CONTRIBUTOR" | "ADMIN";

export type ContributionContentType = "LESSON" | "QUESTION" | "QUIZ";
export type ReviewStatus = "DRAFT" | "PENDING_REVIEW" | "REJECTED" | "PUBLISHED";

export interface ContributionSummary {
  id: string;
  contentType: ContributionContentType;
  contentId: string;
  title: string;
  status: ReviewStatus;
  contributorId: string;
  contributorName: string;
  contributorEmail: string;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}

export interface ReviewHistory {
  id: string;
  action: "CREATED" | "EDITED" | "SUBMITTED" | "REJECTED" | "APPROVED" | "PUBLISHED";
  actorId: string;
  actorName: string;
  comment: string | null;
  occurredAt: string;
}

export interface ContributionDetail {
  submission: ContributionSummary;
  content: unknown;
  history: ReviewHistory[];
}

export interface AdminUserSummary {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLessonActivity {
  lessonId: string;
  lessonTitle: string;
  activeSeconds: number;
  maxScrollPercent: number;
  readingQualified: boolean;
  lastViewedAt: string;
}

export interface AdminQuizActivity {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  scorePercentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface AdminUserDetail {
  account: AdminUserSummary;
  joinedLearningPaths: number;
  trackedLessons: number;
  readingQualifiedLessons: number;
  quizAttempts: number;
  submittedQuizAttempts: number;
  passedQuizAttempts: number;
  failedQuizAttempts: number;
  recentLessons: AdminLessonActivity[];
  recentQuizAttempts: AdminQuizActivity[];
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
