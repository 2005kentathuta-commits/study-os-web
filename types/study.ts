export type CardRating = "again" | "hard" | "good" | "easy";

export interface StudyCard {
  id: string;
  question: string;
  answer: string;
  sourceType: "pdf" | "notion" | "manual";
  sourceTitle: string;
  dueAt: string;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
}

export interface GeneratedPackage {
  title: string;
  summary: string;
  keyPoints: string[];
  cards: Array<{ question: string; answer: string }>;
}
