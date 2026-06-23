import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { AVATARS, useGame, MILESTONES } from "@/lib/game-store";
import { MilestoneNode } from "@/components/MilestoneNode";
import { XPBadge } from "@/components/XPBadge";
import milestonesData from "@/lib/data/milestones.json";
import pathsData from "@/lib/data/paths.json";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [{ title: "World Map — GrammarQuest" }] }),
  component: MapPage,
});

function MapPage() {
  const { user, avatar, xp, completed, badges, isLoading: isGameLoading } = useGame();

  if (isGameLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading map...</div>;
  }

  if (!user) return <Navigate to="/" />;
  if (!avatar) return <Navigate to="/avatar" />;
  const av = AVATARS.find((a) => a.id === avatar)!;

  const offsets = [0, 60, -60, 40];
  const milestones = milestonesData;
  const path = pathsData[0];

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-md">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-full bg-white px-4 py-2 shadow-sm text-sm font-display font-bold text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-all"
          >
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/avatar"
              className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm border border-slate-100"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${av.color} text-xl`}
              >
                {av.emoji}
              </span>
              <span className="font-display font-bold text-sm pr-2">
                {av.name.split(" ")[1] ?? av.name}
              </span>
            </Link>
            <XPBadge xp={xp} />
          </div>
        </div>

        <h1 className="mt-8 text-center text-4xl text-foreground">
          {path?.title || "Naming Kingdom"}
        </h1>
        <p className="text-center text-muted-foreground">
          {path?.description || "Follow the path to complete your quest"}
        </p>

        {/* Path */}
        <div className="relative mt-10 flex flex-col items-center gap-12 pb-16">
          <svg className="absolute inset-0 -z-0 h-full w-full" preserveAspectRatio="none">
            <path
              d="M 50% 5% Q 80% 25%, 50% 40% T 50% 75% T 50% 100%"
              stroke="oklch(0.85 0.05 230)"
              strokeWidth="6"
              strokeDasharray="2 14"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          {milestones.map((m: any, i: number) => {
            const isUnlocked = i === 0 || completed.includes(milestones[i - 1].id as any);
            const status = completed.includes(m.id as any)
              ? "completed"
              : isUnlocked
                ? "available"
                : "locked";
            const milestoneConfig = MILESTONES.find((config) => config.id === m.id);
            const emoji = milestoneConfig?.emoji || "✨";
            return (
              <div key={m.id} className="relative z-10">
                <MilestoneNode
                  id={m.id}
                  title={m.title}
                  subtitle={m.story_intro.substring(0, 30) + "..."}
                  emoji={emoji}
                  status={status}
                  offset={offsets[i % offsets.length]}
                />
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-md">
          <div className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Your Badges
          </div>
          {badges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Complete a quest to earn your first badge!
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => {
                // Prepend emoji if not already present
                const cleanName = b.replace(/^[^a-zA-Z0-9]+/, "").trim();
                const milestone = milestonesData.find(
                  (m: any) => m.badge_name.toLowerCase() === cleanName.toLowerCase()
                );
                const display = milestone && milestone.badge_icon ? `${milestone.badge_icon} ${cleanName}` : b;
                return (
                  <span
                    key={b}
                    className="rounded-full bg-amber-100 px-3 py-1 font-display font-bold text-amber-700"
                  >
                    {display}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
