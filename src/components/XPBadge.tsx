export function XPBadge({ xp }: { xp: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-4 py-2 text-amber-900 font-display font-bold shadow-md">
      <span className="text-xl">⭐</span>
      <span>{xp} XP</span>
    </div>
  );
}

export function HeartsBadge({ hearts }: { hearts: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 font-display font-bold text-rose-600 shadow-md">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={i < hearts ? "" : "opacity-25"}>
          ❤️
        </span>
      ))}
    </div>
  );
}
