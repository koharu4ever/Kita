import type { GameDetail } from "@/features/games/types/game-detail";

export const gameCoverOptions = [
  { label: "Sea Side Fragment", value: "sea-side-fragment" },
  { label: "Night Archive", value: "night-archive" },
  { label: "After Rain", value: "after-rain" },
  { label: "Sunset Field", value: "sunset-field" },
  { label: "Crimson Room", value: "crimson-room" },
  { label: "Harbor Loop", value: "harbor-loop" },
] as const;

export type GameCoverKey = (typeof gameCoverOptions)[number]["value"];

const gameCoverAssets: Record<GameCoverKey, GameDetail["cover"]> = {
  "sea-side-fragment": {
    src: "/home-sea-girl.jpg",
    alt: "A girl standing near the blue sea",
    width: 720,
    height: 960,
  },
  "night-archive": {
    src: "/home-night-sky.jpg",
    alt: "A deep night sky over a quiet landscape",
    width: 720,
    height: 540,
  },
  "after-rain": {
    src: "/home-rain-harbor.jpg",
    alt: "Rain and harbor lights seen through a window",
    width: 720,
    height: 1080,
  },
  "sunset-field": {
    src: "/home-sunset-field.jpg",
    alt: "A sunset field under warm orange light",
    width: 720,
    height: 900,
  },
  "crimson-room": {
    src: "/about-bg.jpg",
    alt: "A crimson interior used as a visual novel placeholder",
    width: 720,
    height: 520,
  },
  "harbor-loop": {
    src: "/home-rain-harbor.jpg",
    alt: "A rainy harbor used for a looping route placeholder",
    width: 720,
    height: 780,
  },
};

export function resolveGameCover(coverKey: string): GameDetail["cover"] {
  if (!(coverKey in gameCoverAssets)) {
    throw new Error(`Unknown game cover key: ${coverKey}`);
  }

  return gameCoverAssets[coverKey as GameCoverKey];
}
