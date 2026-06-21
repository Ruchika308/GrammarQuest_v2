import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  badge: string;
  badgeName: string;
  badgeIcon: string;
  xp: number;
  milestoneTitle: string;
  onContinue: () => void;
};

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb7185"];

export function RewardModal({ open, badge, badgeName, badgeIcon, xp, milestoneTitle, onContinue }: Props) {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 2,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
    })),
  );
  useEffect(() => {
    if (open) {
      /* trigger */
    }
  }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="absolute top-[-20px] block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              animation: `confetti-fall ${p.duration}s ${p.delay}s linear forwards`,
            }}
          />
        ))}
      </div>
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-pop-in">
        <div className="text-sm font-bold uppercase tracking-widest text-emerald-600">
          Milestone Complete
        </div>
        <h2 className="mt-1 text-3xl text-foreground">{milestoneTitle}</h2>
        <div className="mx-auto my-6 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-6xl shadow-xl animate-float-slow">
          🏆
        </div>
        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="text-xs font-bold uppercase tracking-widest text-amber-600">
            Badge Earned
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-foreground shadow-sm">
            <span className="text-2xl leading-none">{badgeIcon}</span>
            <span className="font-display text-xl">{badgeName}</span>
          </div>
          <div className="text-xs text-muted-foreground">{badge}</div>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 font-display font-bold text-amber-700">
          ⭐ +{xp} XP
        </div>
        <p className="mt-4 text-muted-foreground">Amazing work, hero! A new path has opened.</p>
        <button onClick={onContinue} className="btn-quest btn-quest-hover mt-6 w-full">
          Continue
        </button>
      </div>
    </div>
  );
}
