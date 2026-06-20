/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import type { Question } from "@/lib/lessons";

const EMOJI_MAP: Record<string, string> = {
  "dog.png": "🐶",
  "cat.png": "🐱",
  "cow.png": "🐮",
  "horse.png": "🐴",
  "bird.png": "🐦",
  "fish.png": "🐟",
  "rabbit.png": "🐰",
  "elephant.png": "🐘",
  "monkey.png": "🐒",
  "tiger.png": "🐯",
  "teacher.png": "🧑‍🏫",
  "doctor.png": "🧑‍⚕️",
  "farmer.png": "🧑‍🌾",
  "child.png": "👶",
  "friend.png": "🧑‍🤝‍🧑",
  "chef.png": "🧑‍🍳",
  "pilot.png": "🧑‍✈️",
  "nurse.png": "🧑‍⚕️",
  "player.png": "🏃",
  "driver.png": "🚗",
  "school.png": "🏫",
  "park.png": "🛝",
  "zoo.png": "🦁",
  "hospital.png": "🏥",
  "market.png": "🛒",
  "library.png": "📚",
  "beach.png": "🏖️",
  "farm.png": "🚜",
  "museum.png": "🏛️",
  "garden.png": "🏡",
  "book.png": "📖",
  "chair.png": "🪑",
  "table.png": "🪟",
  "ball.png": "⚽",
  "bicycle.png": "🚲",
  "pencil.png": "✏️",
  "bag.png": "🎒",
  "bottle.png": "🍼",
  "clock.png": "⏰",
  "computer.png": "💻",
};

type Props = {
  question: any;
  onAnswer: (correct: boolean) => void;
};

export function LessonCard({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const correctAnswer =
    question.type === "match"
      ? ""
      : question.type === "sentence"
        ? question.answer.join(" ")
        : question.answer;

  function check(value: string) {
    if (checked) return;
    setSelected(value);
    setChecked(true);
    setTimeout(() => {
      onAnswer(value === correctAnswer);
      setSelected(null);
      setChecked(false);
    }, 900);
  }

  if (question.type === "match") {
    return <MatchQuestion question={question} onAnswer={onAnswer} />;
  }
  if (question.type === "sentence") {
    return <SentenceQuestion question={question} onAnswer={onAnswer} />;
  }

  const options = question.options;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {question.image_url ? (
        <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-200 to-indigo-200 text-7xl shadow-lg animate-float-slow">
          {EMOJI_MAP[question.image_url] || "✨"}
        </div>
      ) : (
        question.type === "image" && (
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-200 to-indigo-200 text-7xl shadow-lg animate-float-slow">
            {question.emoji}
          </div>
        )
      )}
      <h2 className="text-center text-2xl text-foreground">{question.prompt}</h2>
      {question.type === "fill-blank" && (
        <div className="rounded-2xl bg-muted px-5 py-4 text-lg text-foreground font-medium">
          {question.sentence}
        </div>
      )}
      <div className="grid w-full gap-3">
        {options.map((opt: string) => {
          const isSel = selected === opt;
          const isRight = opt === correctAnswer;
          let cls = "border-border bg-white hover:border-primary hover:-translate-y-0.5";
          if (checked && isSel && isRight)
            cls = "border-emerald-500 bg-emerald-50 text-emerald-700";
          else if (checked && isSel && !isRight)
            cls = "border-rose-500 bg-rose-50 text-rose-700 animate-shake";
          else if (checked && isRight) cls = "border-emerald-500 bg-emerald-50 text-emerald-700";
          return (
            <button
              key={opt}
              onClick={() => check(opt)}
              disabled={checked}
              className={`rounded-2xl border-2 p-4 text-lg font-display font-bold transition-all shadow-sm ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MatchQuestion({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "match" }>;
  onAnswer: (c: boolean) => void;
}) {
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const rights = [...question.pairs].sort(() => 0.5 - Math.random());

  function pickRight(r: string) {
    if (!leftSel) return;
    const correct = question.pairs.find((p: any) => p.left === leftSel)?.right === r;
    if (correct) {
      const next = { ...matches, [leftSel]: r };
      setMatches(next);
      setLeftSel(null);
      if (Object.keys(next).length === question.pairs.length) {
        setTimeout(() => onAnswer(true), 500);
      }
    } else {
      setWrong(r);
      setTimeout(() => setWrong(null), 400);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-center text-2xl text-foreground">{question.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {question.pairs.map((p: any) => {
            const done = matches[p.left];
            return (
              <button
                key={p.left}
                disabled={!!done}
                onClick={() => setLeftSel(p.left)}
                className={`rounded-2xl border-2 p-3 font-display font-bold ${
                  done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : leftSel === p.left
                      ? "border-primary bg-primary/10"
                      : "border-border bg-white"
                }`}
              >
                {p.left}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rights.map((p: any) => {
            const matched = Object.values(matches).includes(p.right);
            return (
              <button
                key={p.right}
                disabled={matched}
                onClick={() => pickRight(p.right)}
                className={`rounded-2xl border-2 p-3 font-display font-bold ${
                  matched
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : wrong === p.right
                      ? "border-rose-500 bg-rose-50 animate-shake"
                      : "border-border bg-white"
                }`}
              >
                {p.right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SentenceQuestion({
  question,
  onAnswer,
}: {
  question: Extract<Question, { type: "sentence" }>;
  onAnswer: (c: boolean) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const remaining = question.words.filter((w: string, i: number) => !picked.includes(`${w}#${i}`));

  function submit() {
    const cleaned = picked.map((p: string) => p.split("#")[0]);
    const correct = cleaned.join(" ") === question.answer.join(" ");
    setChecked(true);
    setTimeout(() => onAnswer(correct), 800);
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-center text-2xl text-foreground">{question.prompt}</h2>
      <div className="min-h-16 rounded-2xl border-2 border-dashed border-border bg-white p-3 flex flex-wrap gap-2">
        {picked.map((p) => (
          <span key={p} className="rounded-xl bg-primary/10 px-3 py-1 font-display font-bold">
            {p.split("#")[0]}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {question.words.map((w: string, i: number) => {
          const key = `${w}#${i}`;
          if (picked.includes(key)) return null;
          return (
            <button
              key={key}
              onClick={() => setPicked([...picked, key])}
              className="rounded-xl border-2 border-border bg-white px-3 py-2 font-display font-bold"
            >
              {w}
            </button>
          );
        })}
      </div>
      <button
        disabled={remaining.length > 0 || checked}
        onClick={submit}
        className="btn-quest btn-quest-hover disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Check
      </button>
    </div>
  );
}
