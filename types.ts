
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: Question[];
  createdAt: number;
}

export interface QuizResult {
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: number[]; // User selected indices
  timestamp: number;
}

export type AppView = 'home' | 'create' | 'quiz' | 'results' | 'history';
