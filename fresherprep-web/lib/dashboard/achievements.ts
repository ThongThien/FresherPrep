import type { AchievementProgress } from "./types";

export type AchievementSource = keyof AchievementProgress;
export type AchievementIcon = "book" | "stack" | "quiz" | "award";

export interface AchievementDefinition {
  code: string;
  title: string;
  description: string;
  source: AchievementSource;
  target: number;
  icon: AchievementIcon;
}

export const achievementDefinitions: readonly AchievementDefinition[] = [
  { code: "FIRST_STEP", title: "First Step", description: "Complete your first lesson.", source: "completedLessons", target: 1, icon: "book" },
  { code: "GETTING_STARTED", title: "Getting Started", description: "Complete three lessons.", source: "completedLessons", target: 3, icon: "book" },
  { code: "LEARNER", title: "Learner", description: "Complete five lessons.", source: "completedLessons", target: 5, icon: "stack" },
  { code: "CONSISTENT_LEARNER", title: "Consistent Learner", description: "Complete ten lessons.", source: "completedLessons", target: 10, icon: "stack" },
  { code: "KNOWLEDGE_BUILDER", title: "Knowledge Builder", description: "Complete twenty lessons.", source: "completedLessons", target: 20, icon: "award" },
  { code: "QUIZ_STARTER", title: "Quiz Starter", description: "Submit your first quiz attempt.", source: "submittedQuizzes", target: 1, icon: "quiz" },
  { code: "QUIZ_EXPLORER", title: "Quiz Explorer", description: "Submit five quiz attempts.", source: "submittedQuizzes", target: 5, icon: "quiz" },
  { code: "QUIZ_VETERAN", title: "Quiz Veteran", description: "Submit ten quiz attempts.", source: "submittedQuizzes", target: 10, icon: "quiz" },
  { code: "FIRST_PASS", title: "First Pass", description: "Pass your first quiz.", source: "passedQuizzes", target: 1, icon: "award" },
  { code: "QUIZ_ACE", title: "Quiz Ace", description: "Pass five quiz attempts.", source: "passedQuizzes", target: 5, icon: "award" },
  { code: "QUIZ_MASTER", title: "Quiz Master", description: "Pass ten quiz attempts.", source: "passedQuizzes", target: 10, icon: "award" },
];
