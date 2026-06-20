export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-4 w-full rounded-full bg-white/70 shadow-inner overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
