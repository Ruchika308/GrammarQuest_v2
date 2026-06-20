import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { storage, type UserProfile, type MilestoneProgress } from "./storage";

export type AvatarId = "mia" | "leo" | "wizard" | "dragon";

export const AVATARS: { id: AvatarId; name: string; emoji: string; color: string }[] = [
  { id: "mia", name: "Explorer Mia", emoji: "🧭", color: "from-pink-400 to-rose-500" },
  { id: "leo", name: "Explorer Leo", emoji: "🎒", color: "from-amber-400 to-orange-500" },
  { id: "wizard", name: "Wizard", emoji: "🧙", color: "from-violet-400 to-indigo-500" },
  { id: "dragon", name: "Dragon Rider", emoji: "🐉", color: "from-emerald-400 to-teal-500" },
];

export const MILESTONES = [
  { id: "MN", title: "Missing Names", emoji: "🔍", subtitle: "Find the nouns" },
  { id: "SN", title: "Special Names", emoji: "👑", subtitle: "Proper nouns" },
  { id: "OM", title: "One & Many", emoji: "🌉", subtitle: "Singular & plural" },
  { id: "SP", title: "Strange Plurals", emoji: "🧙", subtitle: "Irregular plurals" },
  { id: "TT", title: "Team Trouble", emoji: "🤝", subtitle: "Collective nouns" },
  { id: "MW", title: "Magic Workshop", emoji: "🛠️", subtitle: "Material nouns" },
  { id: "FT", title: "Family Tree", emoji: "🌳", subtitle: "Gender nouns" },
  { id: "IT", title: "Invisible Treasures", emoji: "💎", subtitle: "Abstract nouns" },
  { id: "OI", title: "Ownership Island", emoji: "🏝️", subtitle: "Possessive nouns" },
] as const;

export type MilestoneId = (typeof MILESTONES)[number]["id"];

type State = {
  avatar: AvatarId | null;
  xp: number;
  completed: MilestoneId[];
  badges: string[];
  progress: Record<string, MilestoneProgress>;
};

type Ctx = State & {
  setAvatar: (a: AvatarId) => void;
  addXp: (n: number) => void;
  completeMilestone: (id: MilestoneId, badge: string) => void;
  isUnlocked: (id: MilestoneId) => boolean;
  submitQuestion: (milestoneId: string, questionId: string, correct: boolean) => Promise<boolean>;
  reset: () => void;
  isLoading: boolean;
};

const GameContext = createContext<Ctx | null>(null);

const DEFAULT_PROFILE = {
  name: "Guest Explorer",
  avatar: "mia",
  total_xp: 0,
  badges: [],
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [progress, setProgress] = useState<Record<string, MilestoneProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount (SSR safe)
  useEffect(() => {
    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
    setIsLoading(false);
  }, []);

  const setAvatar = (avatarId: AvatarId) => {
    const updated = { ...profile, avatar: avatarId };
    storage.saveProfile(updated);
    setProfile(updated);
  };

  const addXp = (amount: number) => {
    const updated = { ...profile, total_xp: profile.total_xp + amount };
    storage.saveProfile(updated);
    setProfile(updated);
  };

  const completeMilestone = (milestoneId: MilestoneId, badgeEmoji: string) => {
    // 1. Get/Update milestone progress
    const mProgress = storage.getProgress(milestoneId);
    mProgress.completed = true;
    storage.saveProgress(mProgress);

    // 2. Add Badge & reward completion XP (+50 XP)
    storage.addBadge(badgeEmoji);
    storage.addXP(50);

    // 3. Sync React state
    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
  };

  const isUnlocked = (id: MilestoneId) => {
    const idx = MILESTONES.findIndex((m) => m.id === id);
    if (idx <= 0) return true; // First milestone is always unlocked
    const prevMilestone = MILESTONES[idx - 1];
    const prevProgress = progress[prevMilestone.id];
    // Unlocked only if the previous milestone has a mastery score of 80% or higher
    return prevProgress ? prevProgress.mastery >= 80 : false;
  };

  const submitQuestion = async (milestoneId: string, questionId: string, correct: boolean) => {
    // Record question attempt, calculate new mastery
    storage.recordAttempt(milestoneId, questionId, correct);
    
    // Add XP if correct (+10 XP)
    if (correct) {
      storage.addXP(10);
    }

    // Refresh state
    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
    
    return correct;
  };

  const reset = () => {
    storage.clearAllProgress();
    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
  };

  // Completed milestones computed from progress completes
  const completed = MILESTONES.map((m) => m.id).filter(
    (id) => progress[id]?.completed,
  ) as MilestoneId[];

  const state: State = {
    avatar: (profile.avatar as AvatarId) || null,
    xp: profile.total_xp,
    completed,
    badges: profile.badges,
    progress,
  };

  return (
    <GameContext.Provider
      value={{
        ...state,
        setAvatar,
        addXp,
        completeMilestone,
        isUnlocked,
        submitQuestion,
        reset,
        isLoading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
