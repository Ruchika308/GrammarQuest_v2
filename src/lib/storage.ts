// SSR Guard helper
const isBrowser = typeof window !== "undefined";

export interface UserProfile {
  name: string;
  avatar: string | null;
  total_xp: number;
  badges: string[];
}

export interface MilestoneProgress {
  milestone_id: string;
  attempted: number;
  correct: number;
  mastery: number; // (correct / attempted) * 100
  completed: boolean;
}

export interface SessionHistory {
  session_id: string;
  milestone_id: string;
  started_at: string;
  completed_at?: string;
  hearts_left: number;
  xp_earned: number;
  completed: boolean;
}

export interface PlayerAnswer {
  question_id: string;
  milestone_id: string;
  correct: boolean;
  timestamp: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Guest Explorer",
  avatar: null,
  total_xp: 0,
  badges: [],
};

export const storage = {
  getProfile(): UserProfile {
    if (!isBrowser) return DEFAULT_PROFILE;
    const data = localStorage.getItem("gq_profile");
    if (!data) {
      localStorage.setItem("gq_profile", JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    try {
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_PROFILE,
        ...parsed,
        badges: parsed.badges || [],
      };
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile: UserProfile): void {
    if (!isBrowser) return;
    localStorage.setItem("gq_profile", JSON.stringify(profile));
  },

  addXP(xp: number): number {
    const profile = this.getProfile();
    profile.total_xp += xp;
    this.saveProfile(profile);
    return profile.total_xp;
  },

  addBadge(badge: string): void {
    const profile = this.getProfile();
    if (!profile.badges.includes(badge)) {
      profile.badges.push(badge);
      this.saveProfile(profile);
    }
  },

  getProgress(milestoneId: string): MilestoneProgress {
    const fallback: MilestoneProgress = {
      milestone_id: milestoneId,
      attempted: 0,
      correct: 0,
      mastery: 0,
      completed: false,
    };
    if (!isBrowser) return fallback;
    const progressMap = this.getAllProgress();
    return progressMap[milestoneId] || fallback;
  },

  getAllProgress(): Record<string, MilestoneProgress> {
    if (!isBrowser) return {};
    const data = localStorage.getItem("gq_progress");
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  saveProgress(progress: MilestoneProgress): void {
    if (!isBrowser) return;
    const progressMap = this.getAllProgress();
    progressMap[progress.milestone_id] = progress;
    localStorage.setItem("gq_progress", JSON.stringify(progressMap));
  },

  replaceAllProgress(progressMap: Record<string, MilestoneProgress>): void {
    if (!isBrowser) return;
    localStorage.setItem("gq_progress", JSON.stringify(progressMap));
  },

  recordAttempt(milestoneId: string, questionId: string, correct: boolean): MilestoneProgress {
    // 1. Get current milestone progress
    const progress = this.getProgress(milestoneId);
    
    // Update attempts
    progress.attempted += 1;
    if (correct) {
      progress.correct += 1;
    }
    
    // Calculate mastery percentage
    progress.mastery = Math.round((progress.correct / progress.attempted) * 100);
    
    // Mark completed if mastery is >= 80% (requirement check)
    // Note: completed status can also be set explicitly at the end of a successful session.
    if (progress.mastery >= 80 && progress.attempted >= 5) {
      progress.completed = true;
    }
    
    this.saveProgress(progress);

    // 2. Log individual answer attempt
    const answers = this.getAnswers();
    answers.push({
      question_id: questionId,
      milestone_id: milestoneId,
      correct,
      timestamp: new Date().toISOString(),
    });
    if (isBrowser) {
      localStorage.setItem("gq_answers", JSON.stringify(answers));
    }

    return progress;
  },

  getAnswers(): PlayerAnswer[] {
    if (!isBrowser) return [];
    const data = localStorage.getItem("gq_answers");
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveSession(session: SessionHistory): void {
    if (!isBrowser) return;
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.session_id === session.session_id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    localStorage.setItem("gq_sessions", JSON.stringify(sessions));
  },

  getSessions(): SessionHistory[] {
    if (!isBrowser) return [];
    const data = localStorage.getItem("gq_sessions");
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  // Reset helper
  clearAllProgress(): void {
    if (!isBrowser) return;
    localStorage.removeItem("gq_profile");
    localStorage.removeItem("gq_progress");
    localStorage.removeItem("gq_answers");
    localStorage.removeItem("gq_sessions");
    this.clearAuth();
  },

  saveAuth(token: string, user: any): void {
    if (!isBrowser) return;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("google_user", JSON.stringify(user));
  },

  getAuthToken(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem("auth_token");
  },

  getGoogleUser(): any | null {
    if (!isBrowser) return null;
    const data = localStorage.getItem("google_user");
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clearAuth(): void {
    if (!isBrowser) return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("google_user");
  },
};
