import type { AvatarId } from "@/lib/game-store";

type Props = {
  id: AvatarId;
  name: string;
  emoji: string;
  color: string;
  selected: boolean;
  onSelect: (id: AvatarId) => void;
};

export function AvatarCard({ id, name, emoji, color, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={`group relative flex flex-col items-center gap-3 rounded-3xl border-4 p-6 transition-all bg-white ${
        selected
          ? "border-primary scale-105 shadow-xl"
          : "border-transparent hover:scale-105 shadow-md"
      }`}
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${color} text-5xl shadow-lg ${selected ? "animate-wiggle" : ""}`}
      >
        {emoji}
      </div>
      <div className="font-display font-bold text-foreground">{name}</div>
      {selected && (
        <div className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-pop-in">
          ✓
        </div>
      )}
    </button>
  );
}
