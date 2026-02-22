import { CardRating, StudyCard } from "@/types/study";

const INTERVAL_BASE: Record<CardRating, number> = {
  again: 0,
  hard: 1.2,
  good: 1.8,
  easy: 2.5,
};

const EASE_DELTA: Record<CardRating, number> = {
  again: -0.25,
  hard: -0.1,
  good: 0,
  easy: 0.15,
};

export function nextByRating(card: StudyCard, rating: CardRating): StudyCard {
  const now = new Date();
  const isAgain = rating === "again";

  const reps = isAgain ? 0 : card.reps + 1;
  const lapses = isAgain ? card.lapses + 1 : card.lapses;
  const ease = Math.max(1.3, card.ease + EASE_DELTA[rating]);

  const current = Math.max(1, card.intervalDays || 1);
  let intervalDays = 1;

  if (isAgain) {
    intervalDays = 0;
  } else if (card.reps <= 1) {
    intervalDays = rating === "hard" ? 1 : 2;
  } else {
    intervalDays = Math.max(1, Math.round(current * ease * INTERVAL_BASE[rating]));
  }

  const due = new Date(now);
  due.setDate(due.getDate() + intervalDays);

  return {
    ...card,
    reps,
    lapses,
    ease,
    intervalDays,
    dueAt: due.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

export function dueCards(cards: StudyCard[], at = new Date()): StudyCard[] {
  return cards
    .filter((c) => new Date(c.dueAt) <= at)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
}

export function makeCard(input: {
  question: string;
  answer: string;
  sourceType: "pdf" | "notion" | "manual";
  sourceTitle: string;
}): StudyCard {
  const now = new Date().toISOString();
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    question: input.question,
    answer: input.answer,
    sourceType: input.sourceType,
    sourceTitle: input.sourceTitle,
    dueAt: now,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    lastReviewedAt: undefined,
  };
}
