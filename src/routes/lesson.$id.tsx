import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useGame, type MilestoneId } from "@/lib/game-store";
import { ProgressBar } from "@/components/ProgressBar";
import { HeartsBadge, XPBadge } from "@/components/XPBadge";
import { LessonCard } from "@/components/LessonCard";
import { RewardModal } from "@/components/RewardModal";
import { trackEvent } from "@/lib/analytics";
import { playCorrectSound, playIncorrectSound, playCompleteSound } from "@/lib/sounds";
import { generateSessionQuestions } from "@/lib/session";
import milestonesData from "@/lib/data/milestones.json";
import questionsData from "@/lib/data/questions.json";

const milestoneIntroContent: Record<
  string,
  {
    story: string[];
    learningGoal: string;
  }
> = {
  "MN": {
    story: [
      "The Naming Kingdom has lost the names of everyday things.",
      "Explorer must help villagers remember what objects, animals and places are called.",
    ],
    learningGoal: "Recognize names of everyday people, places, animals and things.",
  },
  "SN": {
    story: [
      "Important places, people and days across the kingdom have lost their special name tags.",
      "Explorer must spot the names that deserve capital letters and help return them to the right heroes and places.",
    ],
    learningGoal: "Recognize proper nouns and identify names that need capital letters.",
  },
  "OM": {
    story: [
      "Creatures and treasures are multiplying all across the kingdom.",
      "Explorer must help the villagers decide when to use one name and when to use many names.",
    ],
    learningGoal: "Recognize singular and plural nouns and choose the correct form.",
  },
};

export const Route = createFileRoute("/lesson/$id")({
  head: () => ({ meta: [{ title: "Quest — GrammarQuest" }] }),
  component: LessonPage,
});

function LessonPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, completeMilestone, xp, submitQuestion, completed, isLoading } = useGame();

  const milestone = milestonesData.find((m: any) => m.id === id);

  // Compute isUnlocked dynamically
  const isUnlocked = () => {
    if (!milestone) return false;
    const idx = milestonesData.findIndex((m: any) => m.id === id);
    if (idx <= 0) return true;
    return completed.includes(milestonesData[idx - 1].id as any);
  };

  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [earned, setEarned] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [forceReplay, setForceReplay] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, { userAnswer: string; correct: boolean }>>({});
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Generate local session of questions or load completed ones for review
  useEffect(() => {
    if (milestone) {
      const isLevelCompleted = completed.includes(milestone.id as any) && !forceReplay;
      
      if (isLevelCompleted) {
        // In review mode: try to load the completed question IDs
        let loadedQuestions: any[] = [];
        if (typeof window !== "undefined") {
          try {
            const storedIds = localStorage.getItem(`gq_completed_questions_${milestone.id}`);
            if (storedIds) {
              const ids: string[] = JSON.parse(storedIds);
              // Find the corresponding questions in questionsData
              loadedQuestions = ids
                .map((id) => (questionsData as any[]).find((q) => q.id === id))
                .filter(Boolean);
            }
          } catch (e) {
            console.error("Failed to load completed milestone questions:", e);
          }
        }
        
        if (loadedQuestions.length > 0) {
          setQuestions(loadedQuestions);
          setIsQuestionsLoading(false);
          return;
        }
      }

      if (isUnlocked() || forceReplay) {
        const generated = generateSessionQuestions(id, completed);
        setQuestions(generated);
        setIsQuestionsLoading(false);
      }
    }
  }, [id, forceReplay, completed]);

  const total = questions.length;
  const question = questions[idx];

  useEffect(() => {
    if (milestone) {
      trackEvent("Milestone Started", { milestone_id: milestone.id });
    }
  }, [milestone?.id]);

  useEffect(() => {
    if (question) {
      trackEvent("Question Viewed", { question_id: question.id, milestone_id: milestone?.id });
    }
  }, [milestone?.id, question]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!milestone) return <Navigate to="/map" />;
  if (!isUnlocked() && !forceReplay) return <Navigate to="/map" />;

  if (isQuestionsLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">Loading questions...</div>
    );

  const isLevelCompleted = completed.includes(milestone.id as any) && !forceReplay;
  const badgeName = milestone.badge_name || "Champion";
  const badgeIcon = milestone.badge_icon || "🏆";
  const earnedBadge = `${badgeIcon} ${badgeName}`;

  if (isLevelCompleted) {
    const hasPlayedSession = Object.keys(sessionAnswers).length > 0;

    return (
      <main className="min-h-screen px-4 py-6 bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate({ to: "/map" })}
              className="text-2xl text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="text-sm font-display font-bold uppercase tracking-widest text-primary">
              {milestone.title}
            </div>
            <XPBadge xp={xp} />
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-xl border border-indigo-50 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h1 className="text-3xl font-display font-bold text-foreground">Quest Conquered!</h1>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 font-display font-bold text-amber-800">
              <span className="text-lg leading-none">{badgeIcon}</span>
              <span>{badgeName}</span>
            </div>
            
            {hasPlayedSession ? (
              <div className="mt-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-display font-bold">
                You answered {correctAnswersCount} out of {total} questions correctly! 🎉
              </div>
            ) : (
              <p className="text-muted-foreground mt-2">
                You have completed this quest. Below are the correct answers for review.
              </p>
            )}

            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={() => navigate({ to: "/map" })}
                className="btn-quest btn-quest-hover py-3 px-6 text-sm font-bold shadow-md cursor-pointer"
              >
                Back to Map
              </button>
              <button
                onClick={() => {
                  setIdx(0);
                  setHearts(3);
                  setEarned(0);
                  setGameOver(false);
                  setForceReplay(true);
                  setShowIntro(true);
                  setSessionAnswers({});
                  setCorrectAnswersCount(0);
                }}
                className="rounded-2xl border-2 border-primary/20 bg-white px-6 py-3 font-display font-bold text-primary hover:bg-primary/5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Replay Quest
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-display font-bold text-foreground px-2">
              Quest Questions & Answers
            </h2>
            {questions.map((q: any, i: number) => {
              const answerInfo = sessionAnswers[q.id];
              const isSentence = q.question_type === "sentence" || q.type === "sentence";
              const isMatch = q.question_type === "match" || q.type === "match";

              return (
                <div
                  key={q.id || i}
                  className="rounded-2xl bg-white p-5 shadow-md border border-indigo-50 flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-display text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    <div className="font-semibold text-foreground">{q.prompt}</div>
                  </div>

                  {isSentence ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-3 font-semibold text-sm text-emerald-700">
                        <span className="font-bold block text-xs uppercase tracking-wider text-emerald-600 mb-1">Correct Sentence:</span>
                        {Array.isArray(q.correct_answer) ? q.correct_answer.join(" ") : q.correct_answer}
                      </div>
                      {answerInfo && !answerInfo.correct && (
                        <div className="rounded-xl border border-rose-500 bg-rose-50 p-3 font-semibold text-sm text-rose-700">
                          <span className="font-bold block text-xs uppercase tracking-wider text-rose-600 mb-1">Your Sentence:</span>
                          {answerInfo.userAnswer}
                        </div>
                      )}
                    </div>
                  ) : isMatch ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-3 font-semibold text-sm text-emerald-700">
                        <span className="font-bold block text-xs uppercase tracking-wider text-emerald-600 mb-1">Word Pairs:</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {q.pairs?.map((p: any, idx: number) => (
                            <div key={idx} className="bg-white/60 p-1.5 rounded border border-emerald-200 text-center">
                              {p.left} ➔ {p.right}
                            </div>
                          )) || (
                            <div className="text-muted-foreground col-span-2 text-center py-1">Matched successfully</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 mt-1">
                      {[q.option_a, q.option_b, q.option_c, q.option_d]
                        .filter(Boolean)
                        .map((opt: string) => {
                          const isCorrect = opt === q.correct_answer;
                          const isUserAnswer = answerInfo?.userAnswer === opt;
                          
                          let borderCls = "border-border bg-white text-muted-foreground opacity-60";
                          let prefix = "○";
                          
                          if (isCorrect) {
                            borderCls = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold opacity-100";
                            prefix = "✓";
                          } else if (isUserAnswer && !isCorrect) {
                            borderCls = "border-rose-500 bg-rose-50 text-rose-700 font-bold opacity-100 animate-shake";
                            prefix = "✗";
                          }

                          return (
                            <div
                              key={opt}
                              className={`rounded-xl border p-3 text-sm transition-colors ${borderCls}`}
                            >
                              <span className="mr-2 font-display">{prefix}</span>
                              {opt}
                              {isUserAnswer && !isCorrect && (
                                <span className="ml-2 text-xs font-display bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded-md">Your Answer</span>
                              )}
                              {isUserAnswer && isCorrect && (
                                <span className="ml-2 text-xs font-display bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">Your Answer</span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  async function handleAnswer(correct: boolean, userAnswer: string) {
    if (question) {
      await submitQuestion(milestone!.id, question.id, correct, userAnswer);
      setSessionAnswers((prev) => ({
        ...prev,
        [question.id]: { userAnswer, correct },
      }));
      if (correct) {
        setCorrectAnswersCount((c) => c + 1);
      }
    }

    if (correct) {
      playCorrectSound();
      setEarned((e) => e + 10);
    } else {
      playIncorrectSound();
      setHearts((h) => Math.max(0, h - 1));
    }

    // Hearts check
    if (hearts - (correct ? 0 : 1) <= 0 && !correct) {
      setGameOver(true);
      return;
    }

    if (idx + 1 >= total) {
      let completeXp = 50;
      // Perfect session bonus check (+10 XP)
      const isPerfect = (hearts - (correct ? 0 : 1)) === 3;
      if (isPerfect) {
        completeXp += 10;
      }

      // Save the exact questions played in this completed milestone session!
      if (typeof window !== "undefined") {
        try {
          const questionIds = questions.map((q) => q.id);
          localStorage.setItem(`gq_completed_questions_${milestone!.id}`, JSON.stringify(questionIds));
        } catch (e) {
          console.error("Failed to save completed milestone questions:", e);
        }
      }

      setEarned((e) => e + 50 + (isPerfect ? 10 : 0));
      await completeMilestone(milestone!.id as MilestoneId, earnedBadge, isPerfect ? 10 : 0);
      trackEvent("Milestone Completed", { milestone_id: milestone!.id, perfect: isPerfect });

      setTimeout(() => {
        playCompleteSound();
      }, 450);
      setShowReward(true);
    } else {
      setIdx((i) => i + 1);
    }
  }

  const milestoneTitle = milestone.title;
  const introContent = milestoneIntroContent[milestone.id] ?? {
    story: [milestone.story_intro],
    learningGoal: milestone.concept
      ? `Learn and master ${milestone.concept
          .split("_")
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")}.`
      : "Complete this milestone and build your grammar skills.",
  };

  return (
    <main className="min-h-screen px-4 py-6">
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/map" })}
            className="text-2xl text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
          <div className="flex-1">
            <ProgressBar value={showIntro ? 0 : idx + 1} max={total || 1} />
          </div>
          <HeartsBadge hearts={hearts} />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-display font-bold uppercase tracking-widest text-primary">
            {milestoneTitle}
          </div>
          <XPBadge xp={xp + earned} />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl mt-2">
          {showIntro ? (
            <div className="flex flex-col gap-6">
              <div className="space-y-2 text-center">
                <div className="text-sm font-display font-bold uppercase tracking-[0.24em] text-primary">
                  Ready for your quest?
                </div>
                <h1 className="text-3xl text-foreground">{milestoneTitle}</h1>
              </div>

              <div className="rounded-3xl bg-linear-to-br from-sky-50 via-white to-emerald-50 p-5">
                <div className="text-xs font-display font-bold uppercase tracking-widest text-primary">
                  Story
                </div>
                <div className="mt-3 space-y-3 text-base text-foreground">
                  {introContent.story.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="text-xs font-display font-bold uppercase tracking-widest text-emerald-700">
                  Learning Goal
                </div>
                <p className="mt-3 text-base font-semibold text-emerald-900">
                  {introContent.learningGoal}
                </p>
              </div>

              <button
                onClick={() => setShowIntro(false)}
                className="btn-quest btn-quest-hover mx-auto"
              >
                Start Quest
              </button>
            </div>
          ) : gameOver ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl text-foreground">Out of hearts!</h2>
              <p className="text-muted-foreground mt-2">No worries, brave hero. Try again!</p>
              <button
                onClick={() => {
                  setHearts(3);
                  setIdx(0);
                  setEarned(0);
                  setGameOver(false);
                }}
                className="btn-quest btn-quest-hover mt-6"
              >
                Retry quest
              </button>
            </div>
          ) : question ? (
            <LessonCard
              key={idx}
              question={{
                ...question,
                type: question.question_type,
                options: [
                  question.option_a,
                  question.option_b,
                  question.option_c,
                  question.option_d,
                ].filter(Boolean),
                answer: question.correct_answer,
              }}
              onAnswer={handleAnswer}
            />
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          +10 XP per correct answer · +50 XP bonus for completing the quest
        </p>
      </div>

      <RewardModal
        open={showReward}
        badge={earnedBadge}
        badgeName={badgeName}
        badgeIcon={badgeIcon}
        xp={earned}
        milestoneTitle={milestoneTitle}
        onContinue={() => {
          setShowReward(false);
          setForceReplay(false);
          navigate({ to: "/map" });
        }}
      />
    </main>
  );
}
