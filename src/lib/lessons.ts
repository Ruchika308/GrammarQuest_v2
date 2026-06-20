import type { MilestoneId } from "./game-store";

export type Question =
  | { type: "multiple-choice"; prompt: string; options: string[]; answer: string }
  | { type: "image"; emoji: string; prompt: string; options: string[]; answer: string }
  | { type: "match"; prompt: string; pairs: { left: string; right: string }[] }
  | { type: "fill-blank"; prompt: string; sentence: string; options: string[]; answer: string }
  | { type: "sentence"; prompt: string; words: string[]; answer: string[] };

export const LESSONS: Record<string, { title: string; badge: string; questions: Question[] }> =
  {
    "missing-names": {
      title: "Missing Names",
      badge: "Noun Hunter 🏹",
      questions: [
        {
          type: "image",
          emoji: "🐶",
          prompt: "What is this?",
          options: ["Dog", "Delhi", "Monday"],
          answer: "Dog",
        },
        {
          type: "multiple-choice",
          prompt: "Which word is a noun?",
          options: ["Run", "Apple", "Quickly"],
          answer: "Apple",
        },
        {
          type: "image",
          emoji: "🏫",
          prompt: "Pick the noun for this picture",
          options: ["Jump", "School", "Happy"],
          answer: "School",
        },
        {
          type: "fill-blank",
          prompt: "Fill in the noun",
          sentence: "I ride my ___ to the park.",
          options: ["bike", "slowly", "blue"],
          answer: "bike",
        },
        {
          type: "multiple-choice",
          prompt: "Find the noun in: 'The cat sleeps.'",
          options: ["The", "cat", "sleeps"],
          answer: "cat",
        },
      ],
    },
    "special-names": {
      title: "Special Names",
      badge: "Name Master 👑",
      questions: [
        {
          type: "multiple-choice",
          prompt: "Which is a special (proper) noun?",
          options: ["city", "Paris", "river"],
          answer: "Paris",
        },
        {
          type: "image",
          emoji: "🗽",
          prompt: "What is the special name?",
          options: ["statue", "Statue of Liberty", "thing"],
          answer: "Statue of Liberty",
        },
        {
          type: "fill-blank",
          prompt: "Fill the proper noun",
          sentence: "My friend's name is ___.",
          options: ["girl", "Anna", "child"],
          answer: "Anna",
        },
        {
          type: "multiple-choice",
          prompt: "Which day is a proper noun?",
          options: ["today", "Monday", "weekend"],
          answer: "Monday",
        },
        {
          type: "multiple-choice",
          prompt: "Pick the proper noun",
          options: ["country", "India", "place"],
          answer: "India",
        },
      ],
    },
    "one-and-many": {
      title: "One & Many",
      badge: "Plural Pro ✨",
      questions: [
        {
          type: "multiple-choice",
          prompt: "Plural of 'cat'?",
          options: ["cat", "cats", "caties"],
          answer: "cats",
        },
        {
          type: "image",
          emoji: "🍎🍎🍎",
          prompt: "How do we say this?",
          options: ["apple", "apples", "an apple"],
          answer: "apples",
        },
        {
          type: "multiple-choice",
          prompt: "Plural of 'child'?",
          options: ["childs", "children", "childes"],
          answer: "children",
        },
        {
          type: "fill-blank",
          prompt: "Pick the plural",
          sentence: "I have three ___.",
          options: ["book", "books", "booking"],
          answer: "books",
        },
        {
          type: "multiple-choice",
          prompt: "Which is singular?",
          options: ["dogs", "dog", "boxes"],
          answer: "dog",
        },
      ],
    },
  };
