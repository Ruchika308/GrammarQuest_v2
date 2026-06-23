/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { resolveAssetEmoji, getTwemojiUrl } from "@/lib/asset-registry";
import { playCorrectSound, playIncorrectSound } from "@/lib/sounds";

const CORRECT_FEEDBACK_MS = 1000;

const DEFAULT_EMOJIS = ["😄", "🧠", "🎒", "🧙", "🌟", "🚀", "🎨", "🦖", "🦁", "🎈", "🦄", "🎯", "💡"];

const CORRECT_EFFECTS = [
  { emoji: "👍", text: "Good Job!", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { emoji: "⭐", text: "Super Star!", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { emoji: "✨", text: "Sparkling!", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { emoji: "😊", text: "Correct!", color: "text-primary bg-emerald-50 border-emerald-100" }
];

function getFallbackEmoji(prompt: string) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = prompt.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_EMOJIS.length;
  return DEFAULT_EMOJIS[index];
}

type Props = {
  question: any;
  onAnswer: (correct: boolean, userAnswer: string) => void;
};

export function LessonCard({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [activeEffect, setActiveEffect] = useState<{
    emoji: string;
    text: string;
    color: string;
    option: string;
  } | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    isCheckingRef.current = false;
  }, [question.id]);

  const correctAnswer =
    question.type === "match"
      ? ""
      : question.type === "sentence"
        ? Array.isArray(question.answer)
          ? question.answer.join(" ")
          : question.answer
        : question.answer;

  function check(value: string) {
    if (checked || isCheckingRef.current) return;
    isCheckingRef.current = true;
    setSelected(value);
    setChecked(true);

    const isRight = value === correctAnswer;
    if (isRight) {
      playCorrectSound();
      const effect = CORRECT_EFFECTS[Math.floor(Math.random() * CORRECT_EFFECTS.length)];
      setActiveEffect({ ...effect, option: value });
    } else {
      playIncorrectSound();
    }

    setTimeout(() => {
      onAnswer(isRight, value);
      isCheckingRef.current = false;
      setSelected(null);
      setChecked(false);
      setActiveEffect(null);
    }, CORRECT_FEEDBACK_MS);
  }

  const resolvedEmoji = question.image_url
    ? resolveAssetEmoji(question.image_url)
    : (question.emoji || getFallbackEmoji(question.prompt || ""));

  const twemojiUrl = getTwemojiUrl(resolvedEmoji);

  const imageElement = (
    <div className="flex h-40 w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-200 to-indigo-200 p-6 shadow-lg animate-float-slow">
      <img
        src={twemojiUrl}
        alt="question illustration"
        className="h-full w-full object-contain"
        onError={(e) => {
          // Fallback to text emoji if network/CDN fails
          (e.target as HTMLElement).style.display = "none";
          const parent = (e.target as HTMLElement).parentElement;
          if (parent) {
            const textNode = document.createTextNode(resolvedEmoji);
            parent.appendChild(textNode);
          }
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {question.type === "match" ? (
        <MatchQuestion
          question={question}
          onAnswer={onAnswer}
        />
      ) : question.type === "sentence" ? (
        <SentenceQuestion
          question={question}
          onAnswer={onAnswer}
        />
      ) : (
        <>
          {imageElement}
          <h2 className="text-center text-2xl text-foreground font-display font-bold">
            {question.prompt}
          </h2>
          {question.type === "fill-blank" && (
            <div className="rounded-2xl bg-muted px-5 py-4 text-lg text-foreground font-semibold">
              {question.sentence}
            </div>
          )}
          <div className="grid w-full gap-3">
            {question.options.map((opt: string) => {
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
                  className={`relative rounded-2xl border-2 p-4 text-lg font-display font-bold transition-all shadow-sm cursor-pointer ${cls}`}
                >
                  {opt}
                  {activeEffect && activeEffect.option === opt && (
                    <div className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full border shadow-md font-display font-bold text-sm pointer-events-none animate-float-fade-up ${activeEffect.color}`}>
                      <span className="text-3xl leading-none">{activeEffect.emoji}</span>
                      <span>{activeEffect.text}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function MatchQuestion({
  question,
  onAnswer,
}: {
  question: any;
  onAnswer: (correct: boolean, userAnswer: string) => void;
}) {
  const [leftSel, setLeftSel] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [activeEffect, setActiveEffect] = useState<{
    emoji: string;
    text: string;
    color: string;
  } | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    isCheckingRef.current = false;
  }, [question.id]);

  const rights = [...question.pairs].sort(() => 0.5 - Math.random());

  function pickRight(r: string) {
    if (checked || isCheckingRef.current || !leftSel) return;
    const correct = question.pairs.find((p: any) => p.left === leftSel)?.right === r;
    if (correct) {
      const next = { ...matches, [leftSel]: r };
      setMatches(next);
      setLeftSel(null);
      if (Object.keys(next).length === question.pairs.length) {
        isCheckingRef.current = true;
        playCorrectSound();
        setChecked(true);
        const effect = CORRECT_EFFECTS[Math.floor(Math.random() * CORRECT_EFFECTS.length)];
        setActiveEffect(effect);
        setTimeout(() => {
          onAnswer(true, "Successfully matched all words! ✅");
          isCheckingRef.current = false;
          setChecked(false);
          setMatches({});
          setActiveEffect(null);
        }, CORRECT_FEEDBACK_MS);
      }
    } else {
      playIncorrectSound();
      setWrong(r);
      setTimeout(() => setWrong(null), 400);
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-center text-2xl text-foreground font-display font-bold">
        {question.prompt}
      </h2>
      <div className="grid grid-cols-2 gap-3 relative">
        <div className="flex flex-col gap-2">
          {question.pairs.map((p: any) => {
            const done = matches[p.left];
            return (
              <button
                key={p.left}
                disabled={!!done || checked}
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
                disabled={matched || checked}
                onClick={() => pickRight(p.right)}
                className={`rounded-2xl border-2 p-3 font-display font-bold ${
                  matched
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : wrong === p.right
                      ? "border-rose-500 bg-rose-50 animate-shake text-rose-700"
                      : "border-border bg-white"
                }`}
              >
                {p.right}
              </button>
            );
          })}
        </div>

        {activeEffect && (
          <div className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full border shadow-md font-display font-bold text-sm pointer-events-none animate-float-fade-up ${activeEffect.color}`}>
            <span className="text-3xl leading-none">{activeEffect.emoji}</span>
            <span>{activeEffect.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SentenceQuestion({
  question,
  onAnswer,
}: {
  question: any;
  onAnswer: (correct: boolean, userAnswer: string) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [activeEffect, setActiveEffect] = useState<{
    emoji: string;
    text: string;
    color: string;
  } | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    isCheckingRef.current = false;
  }, [question.id]);

  const sentenceAnswer = Array.isArray(question.answer)
    ? question.answer.join(" ")
    : question.answer;

  function submit() {
    if (checked || isCheckingRef.current) return;
    isCheckingRef.current = true;
    const cleaned = picked.map((p: string) => p.split("#")[0]);
    const cleanSentence = cleaned.join(" ");
    const correct = cleanSentence === sentenceAnswer;
    setChecked(true);

    if (correct) {
      playCorrectSound();
      const effect = CORRECT_EFFECTS[Math.floor(Math.random() * CORRECT_EFFECTS.length)];
      setActiveEffect(effect);
    } else {
      playIncorrectSound();
    }

    setTimeout(() => {
      onAnswer(correct, cleanSentence);
      isCheckingRef.current = false;
      setChecked(false);
      setPicked([]);
      setActiveEffect(null);
    }, CORRECT_FEEDBACK_MS);
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <h2 className="text-center text-2xl text-foreground font-display font-bold">
        {question.prompt}
      </h2>
      <div className="min-h-16 rounded-2xl border-2 border-dashed border-border bg-white p-3 flex flex-wrap gap-2 items-center justify-center">
        {picked.length === 0 ? (
          <span className="text-muted-foreground text-sm">Tap words to build your sentence</span>
        ) : (
          picked.map((p) => (
            <button
              key={p}
              disabled={checked}
              onClick={() => setPicked(picked.filter((item) => item !== p))}
              className="rounded-xl bg-primary/10 hover:bg-primary/20 px-3 py-1 font-display font-bold text-primary transition-all cursor-pointer"
            >
              {p.split("#")[0]}
            </button>
          ))
        )}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {question.words.map((w: string, i: number) => {
          const key = `${w}#${i}`;
          if (picked.includes(key)) return null;
          return (
            <button
              key={key}
              disabled={checked}
              onClick={() => setPicked([...picked, key])}
              className="rounded-xl border-2 border-border bg-white hover:border-primary/50 px-3 py-2 font-display font-bold cursor-pointer transition-all shadow-sm"
            >
              {w}
            </button>
          );
        })}
      </div>
      <button
        disabled={picked.length === 0 || checked}
        onClick={submit}
        className="relative btn-quest btn-quest-hover disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
      >
        Check
        {activeEffect && (
        <div className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full border shadow-md font-display font-bold text-sm pointer-events-none animate-float-fade-up ${activeEffect.color}`}>
          <span className="text-3xl leading-none">{activeEffect.emoji}</span>
          <span>{activeEffect.text}</span>
        </div>
        )}
      </button>
    </div>
  );
}
