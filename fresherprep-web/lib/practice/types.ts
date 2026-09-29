export type PracticeDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface PracticeExerciseSummary {
  id: string;
  code: string;
  title: string;
  difficulty: PracticeDifficulty;
  concepts: string;
  displayOrder: number;
  locked: boolean;
  completed: boolean;
}

export interface PracticeExerciseDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  difficulty: PracticeDifficulty;
  concepts: string;
  schemaDescription: string;
  hint: string;
  displayOrder: number;
  completed: boolean;
}

export interface SqlResultTable {
  columns: string[];
  rows: string[][];
}

export interface SqlSubmitResult {
  correct: boolean;
  firstCompletion: boolean;
  awardedPoints: number;
  message: string;
  explanation: string | null;
  result: SqlResultTable | null;
}

