import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { storage, type UserProfile, type MilestoneProgress } from "./storage";
import { decodeJwt, type GoogleUser } from "./google-auth";

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
  user: GoogleUser | null;
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
  login: (token: string) => void;
  logout: () => void;
};

const GameContext = createContext<Ctx | null>(null);

const DEFAULT_PROFILE = {
  name: "Guest Explorer",
  avatar: "mia",
  total_xp: 0,
  badges: [],
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [progress, setProgress] = useState<Record<string, MilestoneProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount (SSR safe)
  useEffect(() => {
    const cachedUser = storage.getGoogleUser();
    const token = storage.getAuthToken();
    if (cachedUser && token) {
      setUser(cachedUser);
      setProfile(storage.getProfile());
      setProgress(storage.getAllProgress());
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    const decoded = decodeJwt(token);
    if (decoded) {
      storage.saveAuth(token, decoded);
      setUser(decoded);
      // Synchronize/load profile
      setProfile(storage.getProfile());
      setProgress(storage.getAllProgress());
    }
  };

  const logout = () => {
    storage.clearAllProgress();
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setProgress({});
  };

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
    const mProgress = storage.getProgress(milestoneId);
    mProgress.completed = true;
    storage.saveProgress(mProgress);

    storage.addBadge(badgeEmoji);
    storage.addXP(50);

    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
  };

  const isUnlocked = (id: MilestoneId) => {
    const idx = MILESTONES.findIndex((m) => m.id === id);
    if (idx <= 0) return true;
    const prevMilestone = MILESTONES[idx - 1];
    const prevProgress = progress[prevMilestone.id];
    return prevProgress ? prevProgress.mastery >= 80 : false;
  };

  const submitQuestion = async (milestoneId: string, questionId: string, correct: boolean) => {
    storage.recordAttempt(milestoneId, questionId, correct);
    
    if (correct) {
      storage.addXP(10);
    }

    setProfile(storage.getProfile());
    setProgress(storage.getAllProgress());
    
    return correct;
  };

  const reset = () => {
    storage.clearAllProgress();
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setProgress({});
  };

  const completed = MILESTONES.map((m) => m.id).filter(
    (id) => progress[id]?.completed,
  ) as MilestoneId[];

  const state: State = {
    user,
    avatar: user ? ((profile.avatar as AvatarId) || null) : null,
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
        login,
        logout,
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
