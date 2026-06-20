// Reusable asset registry mapping question image keys to emojis.
// This reduces the asset library to less than 100 reusable visuals.

export const ASSET_REGISTRY: Record<string, string> = {
  // Common items / Nouns
  book: "📖",
  pen: "🖊️",
  pencil: "✏️",
  paper: "📄",
  table: "🪵",
  chair: "🪑",
  clock: "⏰",
  bottle: "🍼",
  bag: "🎒",
  backpack: "🎒",
  lamp: "💡",
  toy: "🧸",
  toys: "🧸",
  box: "📦",
  brush: "🖌️",
  watch: "⌚",
  glass: "🥛",
  cup: "🥤",
  dish: "🍽️",
  bench: "🪑",
  car: "🚗",
  bus: "🚌",
  bicycle: "🚲",

  // Animals
  dog: "🐶",
  cat: "🐱",
  lion: "🦁",
  tiger: "🐯",
  fox: "🦊",
  rabbit: "🐰",
  pony: "🐴",
  horse: "🐴",
  cow: "🐮",
  bird: "🐦",
  fish: "🐟",
  elephant: "🐘",
  monkey: "🐒",
  puppy: "🐶",
  animals: "🦁",

  // People / Professions
  teacher: "🧑‍🏫",
  student: "🧑‍🎓",
  doctor: "🧑‍⚕️",
  nurse: "🧑‍⚕️",
  vet: "🧑‍⚕️",
  chef: "🧑‍🍳",
  pilot: "🧑‍✈️",
  driver: "🚗",
  farmer: "🧑‍🌾",
  child: "👶",
  baby: "👶",
  friend: "🧑‍🤝‍🧑",
  people: "🧑‍🤝‍🧑",
  boy: "👦",
  girl: "👧",

  // Places
  school: "🏫",
  library: "📚",
  zoo: "🦁",
  park: "🛝",
  market: "🛒",
  hospital: "🏥",
  beach: "🏖️",
  farm: "🚜",
  museum: "🏛️",
  garden: "🏡",
  city: "🏙️",
  cities: "🏙️",
  places: "🗺️",

  // Special names / Proper nouns
  delhi: "🏙️",
  mumbai: "🏙️",
  kolkata: "🏙️",
  chennai: "🏙️",
  jaipur: "🏙️",
  lucknow: "🏙️",
  pune: "🏙️",
  india: "🇮🇳",
  canada: "🇨🇦",
  japan: "🇯🇵",
  taj_mahal: "🕌",
  red_fort: "🏰",
  gateway_of_india: "🕌",
  qutub_minar: "🗼",
  charminar_hyderabad: "🕌",
  india_gate: "🏛️",
  ganga: "🌊",
  yamuna: "🌊",
  narmada: "🌊",
  diwali: "🪔",
  holi: "🎨",
  eid: "🌙",
  christmas: "🎄",
  new_year: "🎆",

  // Food
  tomato: "🍅",
  apple: "🍎",
  banana: "🍌",
  orange: "🍊",
  grape: "🍇",
  cake: "🍰",
  cookie: "🍪",

  // Miscellaneous / Themes
  concept: "🧠",
  story: "📖",
  map: "🗺️",
  things: "📦",
};

// Clean and resolve any image_url or key string into a standard registry emoji
export function resolveAssetEmoji(key: string | undefined): string {
  if (!key) return "😄";

  // Clean the key: convert "mn_book.png" or "sn_delhi" into "book" or "delhi"
  const clean = key
    .toLowerCase()
    .replace(/\.png$/, "")
    .replace(/^(mn|sn|om|sp|tt|mw|ft|it|oi)_/, "");

  // 1. Direct match in registry
  if (ASSET_REGISTRY[clean]) {
    return ASSET_REGISTRY[clean];
  }

  // 2. Substring matching for group mappings
  const keywords = Object.keys(ASSET_REGISTRY);
  for (const keyword of keywords) {
    if (clean.includes(keyword)) {
      return ASSET_REGISTRY[keyword];
    }
  }

  // 3. Category Fallbacks
  if (clean.includes("river") || clean.includes("lake") || clean.includes("water")) return "🌊";
  if (clean.includes("festival") || clean.includes("celebration") || clean.includes("day")) return "🎉";
  if (clean.includes("building") || clean.includes("monument") || clean.includes("fort")) return "🏰";
  if (clean.includes("person") || clean.includes("man") || clean.includes("woman") || clean.includes("boy") || clean.includes("girl")) return "🧑";
  if (clean.includes("animal") || clean.includes("pet")) return "🐱";
  if (clean.includes("plant") || clean.includes("tree") || clean.includes("flower") || clean.includes("forest")) return "🌳";

  // Final fallback
  return "🌟";
}

// Convert emoji to Twemoji SVG URL
export function getTwemojiUrl(emoji: string): string {
  const codePoints = Array.from(emoji).map((char) => char.codePointAt(0)!.toString(16));
  const hex = codePoints.filter((cp) => cp !== "fe0f").join("-");
  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${hex}.svg`;
}
