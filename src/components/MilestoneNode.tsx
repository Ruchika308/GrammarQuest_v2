import { Link } from "@tanstack/react-router";

type Props = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  status: "locked" | "available" | "completed";
  offset: number;
};

export function MilestoneNode({ id, title, subtitle, emoji, status, offset }: Props) {
  const locked = status === "locked";
  const completed = status === "completed";

  const body = (
    <div
      className="flex flex-col items-center gap-2"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-full text-4xl shadow-xl transition-transform ${
          locked
            ? "bg-muted text-muted-foreground"
            : completed
              ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white animate-float-slow"
              : "bg-gradient-to-br from-amber-300 to-orange-500 text-white animate-float-slow hover:scale-110"
        }`}
        style={{
          boxShadow: locked
            ? undefined
            : "0 8px 0 oklch(0.55 0.2 145 / 0.35), 0 12px 30px -8px oklch(0.5 0.15 145 / 0.5)",
        }}
      >
        {locked ? "🔒" : completed ? "✓" : emoji}
        {!locked && !completed && (
          <span className="absolute -top-2 -right-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow">
            START
          </span>
        )}
      </div>
      <div className="text-center">
        <div
          className={`font-display font-bold ${locked ? "text-muted-foreground" : "text-foreground"}`}
        >
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );

  if (locked) return <div className="opacity-70">{body}</div>;
  return (
    <Link to="/lesson/$id" params={{ id }} className="block">
      {body}
    </Link>
  );
}
