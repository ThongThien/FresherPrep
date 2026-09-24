export interface PublishedQuiz {
  id: string;
  code: string;
  title: string;
  type: string;
  selectionMode: "FIXED" | "RULE_BASED";
  passPercentage: number;
}

export interface AttemptOption {
  id: string;
  position: number;
  content: string;
  correct: boolean | null;
  explanation: string | null;
}

export interface AttemptQuestion {
  id: string;
  questionVersionId: string;
  questionCode: string;
  position: number;
  content: string;
  options: AttemptOption[];
  selectedOptionId: string | null;
  answerCorrect: boolean | null;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  passPercentage: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  scorePercentage: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
  questions: AttemptQuestion[];
}
