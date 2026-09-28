export type CommentTargetType = "LESSON" | "QUIZ";

export interface CommentItem {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  ownedByCurrentUser: boolean;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminNotification {
  id: string;
  commentId: string;
  targetType: CommentTargetType;
  targetId: string;
  targetTitle: string;
  authorName: string;
  commentContent: string;
  createdAt: string;
  readAt: string | null;
}
