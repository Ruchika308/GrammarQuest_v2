import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AvatarCard } from "@/components/AvatarCard";
import { AVATARS, useGame } from "@/lib/game-store";

export const Route = createFileRoute("/avatar")({
  head: () => ({ meta: [{ title: "Choose your hero — GrammarQuest" }] }),
  component: AvatarPage,
});

function AvatarPage() {
  const { avatar, setAvatar } = useGame();
  const navigate = useNavigate();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-4 text-center text-4xl md:text-5xl text-foreground">Choose your hero</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Who will explore the Naming Kingdom with you?
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {AVATARS.map((a) => (
            <AvatarCard key={a.id} {...a} selected={avatar === a.id} onSelect={setAvatar} />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            disabled={!avatar}
            onClick={() => navigate({ to: "/map" })}
            className="btn-quest btn-quest-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            Continue →
          </button>
        </div>
      </div>
    </main>
  );
}
