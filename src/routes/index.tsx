import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrammarQuest â€” Learn through adventures and quests" },
      {
        name: "description",
        content:
          "A playful grammar adventure for kids 7â€“12. Earn XP, collect badges, and conquer the Naming Kingdom.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-6 md:py-8">
        <div className="flex items-center gap-2 text-sm font-display font-bold tracking-widest uppercase text-primary">
          <span aria-hidden="true">🗺️</span> Naming Kingdom
        </div>
        <h1 className="mt-2 text-center text-4xl text-foreground md:text-6xl">
          Grammar<span className="text-primary">Quest</span>
        </h1>
        <p className="mt-2 max-w-xl text-center text-base text-muted-foreground md:text-lg">
          Learn through adventures and quests
        </p>

        <div className="relative my-5 aspect-[1.15/1] w-full max-w-[16rem] overflow-hidden rounded-[2.5rem] shadow-xl md:max-w-[18rem]">
          <img
            src="/hero-bg.jpg"
            alt="GrammarQuest Adventure"
            className="h-full w-full object-cover"
          />
        </div>

        <Link to="/avatar" className="btn-quest btn-quest-hover px-7 py-3 text-base md:text-lg">
          Start Adventure →
        </Link>

        <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-4 text-center shadow-md">
            <div className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Earn XP
            </div>
            <div className="mt-1 text-2xl">⭐</div>
            <div className="font-display font-bold text-foreground">+50 per quest</div>
          </div>
          <div className="rounded-3xl bg-white p-4 text-center shadow-md">
            <div className="text-xs font-display font-bold uppercase tracking-widest text-muted-foreground">
              Collect Badges
            </div>
            <div className="mt-1 flex justify-center gap-1 text-2xl">🏹 👑 ✨</div>
            <div className="font-display font-bold text-foreground">3 to unlock</div>
          </div>
        </div>
      </div>
    </main>
  );
}
