import type {
  LearningPathProgress,
  LearningPathSummary,
  LessonProgress,
  PageResponse,
  UserLearningPath,
} from "@/lib/dashboard/types";

export type {
  LearningPathProgress,
  LearningPathSummary,
  LessonProgress,
  PageResponse,
  UserLearningPath,
};

export interface LearningPathItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  lessonStatus: "PUBLISHED" | string;
  displayOrder: number;
  required: boolean;
  weight: number;
}

export interface LearningPathDetail {
  id: string;
  name: string;
  slug: string;
  technologyId: string;
  technologyName: string;
  status: "PUBLISHED" | string;
  createdAt: string;
  updatedAt: string;
  items: LearningPathItem[];
}

export interface LearningPathListEntry {
  path: LearningPathSummary;
  joined: boolean | null;
  progress: LearningPathProgress | null;
  progressUnavailable: boolean;
}

export interface LearningPathListData {
  paths: PageResponse<LearningPathSummary>;
  entries: LearningPathListEntry[];
  membershipUnavailable: boolean;
}

export interface LearningPathDetailData {
  path: LearningPathDetail;
  joined: boolean | null;
  progress: LearningPathProgress | null;
  lessonProgress: LessonProgress[];
  progressUnavailable: boolean;
  lessonProgressUnavailable: boolean;
}
