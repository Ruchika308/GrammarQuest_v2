import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/game-store";

export const Route = createFileRoute("/auth/callback/google")({
  head: () => ({ meta: [{ title: "Completing Sign In — GrammarQuest" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login, user, avatar, isLoading } = useGame();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Google OAuth implicit flow returns parameter in the hash fragment
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // strip leading '#'
    const idToken = params.get("id_token");

    async function completeLogin() {
      if (idToken) {
        try {
          await login(idToken);
        } catch (err) {
          console.error("Login processing error:", err);
          if (!cancelled) {
            setError("Could not complete login. Please try again.");
          }
        }
      } else if (!cancelled) {
        setError("No token found in response.");
      }
    }

    void completeLogin();

    return () => {
      cancelled = true;
    };
  }, [login]);

  // Redirect user to right route once auth context synchronizes
  useEffect(() => {
    if (!isLoading && user) {
      if (avatar) {
        navigate({ to: "/map" });
      } else {
        navigate({ to: "/avatar" });
      }
    }
  }, [avatar, isLoading, navigate, user]);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-pink-50 text-center">
        <div className="max-w-md p-8 rounded-3xl bg-white border border-rose-100 shadow-xl flex flex-col items-center gap-4">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-2xl font-display font-bold text-rose-600">Authentication Failed</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{error}</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="btn-quest btn-quest-hover mt-2"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <div className="text-lg font-display font-bold text-primary animate-pulse">
          Completing sign in...
        </div>
      </div>
    </main>
  );
}
