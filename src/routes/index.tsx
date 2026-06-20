import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useGame } from "@/lib/game-store";
import { getGoogleAuthUrl } from "@/lib/google-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GrammarQuest — Learn through adventures and quests" },
      {
        name: "description",
        content:
          "A playful grammar adventure for kids 7–12. Earn XP, collect badges, and conquer the Naming Kingdom.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, logout, avatar } = useGame();
  const navigate = useNavigate();

  // Sync route if user is logged in
  useEffect(() => {
    if (user) {
      if (avatar) {
        navigate({ to: "/map" });
      } else {
        navigate({ to: "/avatar" });
      }
    }
  }, [user, avatar]);

  function handleGoogleLogin() {
    window.location.href = getGoogleAuthUrl();
  }

  return (
    <main className="min-h-screen overflow-hidden flex items-center justify-center bg-gradient-to-b from-sky-100 to-indigo-100/50">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-between px-6 py-3 text-center gap-2">
        
        {/* Header */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 justify-center text-xs font-display font-bold tracking-widest uppercase text-primary">
            <span>🗺️</span> Naming Kingdom
          </div>
          <h1 className="text-3xl text-foreground md:text-4xl">
            Grammar<span className="text-primary">Quest</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Learn through adventures and quests
          </p>
        </div>

        {/* Hero Image - Scaled down */}
        <div className="relative my-2 aspect-[1.25/1] w-full max-w-[11rem] overflow-hidden rounded-[2rem] shadow-lg border-2 border-white">
          <img
            src="/hero-bg.jpg"
            alt="GrammarQuest Adventure"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Authentication Actions */}
        {user ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <Link
              to={avatar ? "/map" : "/avatar"}
              className="btn-quest btn-quest-hover py-2.5 px-6 text-sm w-full text-center"
            >
              Continue Adventure →
            </Link>
            <div className="flex items-center gap-2 text-xs mt-1">
              {user.picture && (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="h-5 w-5 rounded-full border border-primary/20"
                />
              )}
              <span className="font-semibold text-muted-foreground">{user.name}</span>
              <button
                onClick={logout}
                className="text-primary hover:underline font-bold text-[10px] uppercase tracking-wider cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs px-2">
            <button
              onClick={handleGoogleLogin}
              className="btn-quest btn-quest-hover py-2.5 px-6 text-sm w-full text-center cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              {/* Google G Logo icon using simple SVG */}
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-7.989 0-4.41 3.529-7.989 7.859-7.989 2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.6 0 10.99-4.637 10.99-11.177 0-.751-.08-1.328-.18-1.887h-10.81z"/>
              </svg>
              Continue with Google
            </button>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Sign in to save your hero progress, badges, and XP!
            </p>
          </div>
        )}

        {/* Feature Cards - Reduced padding & margins */}
        <div className="mt-2 grid w-full max-w-xs grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/90 p-2.5 text-center shadow-sm border border-slate-100">
            <div className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
              Earn XP
            </div>
            <div className="text-lg">⭐</div>
            <div className="font-display font-bold text-xs text-foreground">+50 per quest</div>
          </div>
          <div className="rounded-2xl bg-white/90 p-2.5 text-center shadow-sm border border-slate-100">
            <div className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
              Collect Badges
            </div>
            <div className="flex justify-center gap-0.5 text-lg">🏹 👑 ✨</div>
            <div className="font-display font-bold text-xs text-foreground">3 to unlock</div>
          </div>
        </div>
      </div>
    </main>
  );
}
