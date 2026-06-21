import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { storage, type UserProfile, type MilestoneProgress } from "./storage";
import { decodeJwt, type GoogleUser } from "./google-auth";
import {
  completeMilestone as completeMilestoneOnServer,
  getPlayerState,
  submitQuestionAttempt,
} from "./api/game.server";
import { getGuestUser, updateAvatar, upsertGoogleUser } from "./api/game.server";

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
  setAvatar: (a: AvatarId) => Promise<void>;
  addXp: (n: number) => void;
  completeMilestone: (id: MilestoneId, badge: string, bonusXp?: number) => Promise<void>;
  isUnlocked: (id: MilestoneId) => boolean;
  submitQuestion: (milestoneId: string, questionId: string, correct: boolean, userAnswer?: string) => Promise<boolean>;
  reset: () => void;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const GameContext = createContext<Ctx | null>(null);

const DEFAULT_PROFILE = {
  name: "Guest Explorer",
  avatar: null,
  total_xp: 0,
  badges: [],
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [progress, setProgress] = useState<Record<string, MilestoneProgress>>({});
  const [completedMilestones, setCompletedMilestones] = useState<MilestoneId[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const syncLocalState = useCallback((
    nextProfile: UserProfile,
    nextProgress: Record<string, MilestoneProgress>,
    nextCompleted: MilestoneId[],
  ) => {
    storage.saveProfile(nextProfile);
    storage.replaceAllProgress(nextProgress);
    const completedFromProgress = Object.values(nextProgress)
      .filter((entry) => entry.completed)
      .map((entry) => entry.milestone_id as MilestoneId);
    const mergedCompleted = Array.from(
      new Set([...nextCompleted, ...completedFromProgress]),
    ) as MilestoneId[];
    setProfile(nextProfile);
    setProgress(nextProgress);
    setCompletedMilestones(mergedCompleted);
  }, []);

  const hydrateFromServer = useCallback(async (googleUser?: GoogleUser | null) => {
    if (googleUser) {
      await upsertGoogleUser({ data: googleUser });
    } else {
      await getGuestUser();
    }
    const serverState = await getPlayerState();
    if (serverState.profile) {
      syncLocalState(
        serverState.profile,
        serverState.progress,
        serverState.completed as MilestoneId[],
      );
    }
  }, [syncLocalState]);

  // Load from localStorage on mount (SSR safe)
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const cachedUser = storage.getGoogleUser();
        const token = storage.getAuthToken();
        if (cachedUser && token) {
          setUser(cachedUser);
        }

        setProfile(storage.getProfile());
        setProgress(storage.getAllProgress());

        await hydrateFromServer(cachedUser);
        if (cancelled) {
          return;
        }
      } catch (error) {
        console.error("Failed to bootstrap game state:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [hydrateFromServer]);

  const login = useCallback(async (token: string) => {
    const decoded = decodeJwt(token);
    if (decoded) {
      setIsLoading(true);
      try {
        storage.saveAuth(token, decoded);
        setUser(decoded);
        await hydrateFromServer(decoded);
      } catch (error) {
        console.error("Failed to restore server state after login:", error);
        storage.saveAuth(token, decoded);
        setUser(decoded);
        setProfile(storage.getProfile());
        setProgress(storage.getAllProgress());
        setCompletedMilestones(
          MILESTONES.map((m) => m.id).filter((id) => storage.getProgress(id).completed) as MilestoneId[],
        );
      } finally {
        setIsLoading(false);
      }
    }
  }, [hydrateFromServer]);

  const logout = useCallback(() => {
    storage.clearAllProgress();
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setProgress({});
    setCompletedMilestones([]);
  }, []);

  const setAvatar = useCallback(async (avatarId: AvatarId) => {
    try {
      await updateAvatar({ data: avatarId });
    } catch (error) {
      console.error("Failed to persist avatar:", error);
    }
    const updated = { ...profile, avatar: avatarId };
    storage.saveProfile(updated);
    setProfile(updated);
  }, [profile]);

  const addXp = useCallback((amount: number) => {
    const updated = { ...profile, total_xp: profile.total_xp + amount };
    storage.saveProfile(updated);
    setProfile(updated);
  }, [profile]);

  const completeMilestone = useCallback(async (
    milestoneId: MilestoneId,
    badgeEmoji: string,
    bonusXp = 0,
  ) => {
    let totalXp = storage.getProfile().total_xp + 50 + bonusXp;
    let badgeToSave = badgeEmoji;

    try {
      const result = await completeMilestoneOnServer({ data: { milestoneId, bonusXp } });
      if (result?.success) {
        totalXp = result.totalXp;
        if (result.badgeEarned) {
          badgeToSave = result.badgeEarned;
        }
      }
    } catch (error) {
      console.error("Failed to persist milestone completion:", error);
    }

    const mProgress = storage.getProgress(milestoneId);
    mProgress.completed = true;
    storage.saveProgress(mProgress);

    const currentProfile = storage.getProfile();
    const updatedProfile = {
      ...currentProfile,
      total_xp: totalXp,
      badges: currentProfile.badges.includes(badgeToSave)
        ? currentProfile.badges
        : [...currentProfile.badges, badgeToSave],
    };
    storage.saveProfile(updatedProfile);

    setProfile(updatedProfile);
    setProgress(storage.getAllProgress());
    setCompletedMilestones((current) =>
      current.includes(milestoneId) ? current : [...current, milestoneId],
    );
  }, []);

  const isUnlocked = useCallback((id: MilestoneId) => {
    const idx = MILESTONES.findIndex((m) => m.id === id);
    if (idx <= 0) return true;
    const prevMilestone = MILESTONES[idx - 1];
    return completedMilestones.includes(prevMilestone.id);
  }, [completedMilestones]);

  const submitQuestion = useCallback(async (milestoneId: string, questionId: string, correct: boolean, userAnswer?: string) => {
    try {
      const result = await submitQuestionAttempt({
        data: { milestoneId, questionId, correct, userAnswer },
      });
      if (result?.progress) {
        storage.saveProgress(result.progress);
      } else {
        storage.recordAttempt(milestoneId, questionId, correct, userAnswer);
      }

      if (typeof result?.totalXp === "number") {
        const updatedProfile = { ...storage.getProfile(), total_xp: result.totalXp };
        storage.saveProfile(updatedProfile);
        setProfile(updatedProfile);
      } else if (correct) {
        storage.addXP(10);
        setProfile(storage.getProfile());
      }
    } catch (error) {
      console.error("Failed to persist question attempt:", error);
      storage.recordAttempt(milestoneId, questionId, correct, userAnswer);
      if (correct) {
        storage.addXP(10);
      }
      setProfile(storage.getProfile());
    }

    setProgress(storage.getAllProgress());

    return correct;
  }, []);

  const reset = useCallback(() => {
    storage.clearAllProgress();
    setUser(null);
    setProfile(DEFAULT_PROFILE);
    setProgress({});
    setCompletedMilestones([]);
  }, []);

  const state: State = {
    user,
    avatar: user ? ((profile.avatar as AvatarId) || null) : null,
    xp: profile.total_xp,
    completed: completedMilestones,
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
