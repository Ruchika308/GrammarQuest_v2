import questionsData from "./data/questions.json";
import { MILESTONES } from "./game-store";

export interface Question {
  id: string;
  question_id: string;
  path_id: string;
  milestone_id: string;
  concept: string;
  skill: "recognition" | "classification" | "application" | "transfer";
  difficulty: "explorer" | "detective" | "creator";
  question_type: string;
  prompt: string;
  options: string[];
  answer: string;
  image_url: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
}

// Utility to shuffle an array
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateSessionQuestions(
  milestoneId: string,
  completedMilestones: string[]
): Question[] {
  // Load previous session question IDs to avoid repeats
  let lastSessionIds: string[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("gq_last_session_question_ids");
      if (stored) lastSessionIds = JSON.parse(stored);
    } catch {
      // Ignore
    }
  }

  // Helper to filter and shuffle questions
  const getPool = (mId: string, skill: string) => {
    return shuffle(
      (questionsData as any[]).filter(
        (q) => q.milestone_id === mId && q.skill === skill
      )
    );
  };

  // 1. Current milestone pool
  const recPool = getPool(milestoneId, "recognition");
  const classPool = getPool(milestoneId, "classification");
  const appPool = getPool(milestoneId, "application");
  const transPool = getPool(milestoneId, "transfer");

  // Apply immediate repeat protection (filter out questions from the previous session if possible)
  const filterRepeats = (pool: any[]) => {
    const filtered = pool.filter((q) => !lastSessionIds.includes(q.id));
    // Fall back to original pool if filtering leaves it empty
    return filtered.length > 0 ? filtered : pool;
  };

  const recFiltered = filterRepeats(recPool);
  const classFiltered = filterRepeats(classPool);
  const appFiltered = filterRepeats(appPool);
  const transFiltered = filterRepeats(transPool);

  const selected: Question[] = [];

  // Determine order index of current milestone
  const mIndex = MILESTONES.findIndex((m) => m.id === milestoneId);
  const isAfterMilestone2 = mIndex >= 2; // OM is index 2 (3rd milestone, after MN and SN)

  // 2. Select questions based on composition requirements
  let recTargetCount = 2;

  if (isAfterMilestone2 && completedMilestones.length > 0) {
    // Replace 1 Recognition question with a review question from a completed milestone
    recTargetCount = 1;

    // Pick random completed milestone
    const randomCompletedId =
      completedMilestones[Math.floor(Math.random() * completedMilestones.length)];
    
    // Retrieve questions for that milestone
    const reviewPool = shuffle(
      (questionsData as any[]).filter((q) => q.milestone_id === randomCompletedId)
    );

    if (reviewPool.length > 0) {
      selected.push(reviewPool[0]);
    } else {
      // Fallback: if review pool is empty, restore recognition count
      recTargetCount = 2;
    }
  }

  // Push target questions from current milestone
  if (recFiltered.length >= recTargetCount) {
    selected.push(...recFiltered.slice(0, recTargetCount));
  } else {
    selected.push(...recPool.slice(0, recTargetCount));
  }

  const pushFromPool = (filtered: any[], original: any[]) => {
    if (filtered.length > 0) {
      selected.push(filtered[0]);
    } else if (original.length > 0) {
      selected.push(original[0]);
    }
  };

  pushFromPool(classFiltered, classPool);
  pushFromPool(appFiltered, appPool);
  pushFromPool(transFiltered, transPool);

  // Randomize the sequence of the 5 questions
  const finalQuestions = shuffle(selected);

  // Save these question IDs as "last session" for next play
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "gq_last_session_question_ids",
        JSON.stringify(finalQuestions.map((q) => q.id))
      );
    } catch {
      // Ignore
    }
  }

  return finalQuestions;
}
