export type GameStatus = "finished" | "playing" | "planned";

export type GameItem = {
  slug: string;
  title: string;
  originalTitle?: string;
  developer: string;
  releaseDate: string;
  status: GameStatus;
  summary: string;
  note: string;
  cover: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  tags: string[];
  links: Array<{
    href: string;
    label: string;
  }>;
};

export const gameItems: GameItem[] = [
  {
    slug: "sea-side-fragment",
    title: "Sea Side Fragment",
    originalTitle: "海辺の断章",
    developer: "Placeholder Studio",
    releaseDate: "2024",
    status: "playing",
    summary:
      "A quiet summer story about letters, tide pools, and the fragments people leave behind when they move on.",
    note: "Use this slot for a short personal reading note once real content is ready.",
    cover: {
      src: "/home-sea-girl.jpg",
      alt: "A girl standing near the blue sea",
      width: 720,
      height: 960,
    },
    tags: ["Summer", "Drama", "Memory"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "night-archive",
    title: "Night Archive",
    originalTitle: "夜のアーカイブ",
    developer: "Kita Works",
    releaseDate: "2023",
    status: "finished",
    summary:
      "An atmospheric mystery built around a city observatory, missing recordings, and an old promise under the sky.",
    note: "Good candidate for a future review page because the mood is already close to Kita's homepage.",
    cover: {
      src: "/home-night-sky.jpg",
      alt: "A deep night sky over a quiet landscape",
      width: 720,
      height: 540,
    },
    tags: ["Mystery", "Atmosphere", "Night"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "after-rain",
    title: "After Rain",
    originalTitle: "雨上がりの窓",
    developer: "Rain Window",
    releaseDate: "2022",
    status: "planned",
    summary:
      "A small urban visual novel about waiting rooms, glass reflections, and a harbor that changes after rain.",
    note: "The image ratio is intentionally taller to test the masonry layout against varied covers.",
    cover: {
      src: "/home-rain-harbor.jpg",
      alt: "Rain and harbor lights seen through a window",
      width: 720,
      height: 1080,
    },
    tags: ["Urban", "Rain", "Reflection"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "sunset-field",
    title: "Sunset Field",
    originalTitle: "夕焼けの野原",
    developer: "Orange Hour",
    releaseDate: "2021",
    status: "finished",
    summary:
      "A nostalgic slice-of-life story where the last train, the school field, and a late confession share one orange hour.",
    note: "This entry keeps the calm visual tone that already exists in Kita's public image set.",
    cover: {
      src: "/home-sunset-field.jpg",
      alt: "A sunset field under warm orange light",
      width: 720,
      height: 900,
    },
    tags: ["Slice of Life", "Ending", "Nostalgia"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "crimson-room",
    title: "Crimson Room",
    originalTitle: "赤い部屋の栞",
    developer: "Old Bookmark",
    releaseDate: "2020",
    status: "planned",
    summary:
      "A compact chamber mystery placeholder for testing detail-page metadata, tags, and external links.",
    note: "Uses the about background because the red interior works well for future denser notes.",
    cover: {
      src: "/about-bg.jpg",
      alt: "A crimson interior used as a visual novel placeholder",
      width: 720,
      height: 520,
    },
    tags: ["Mystery", "Room", "Classic"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
  {
    slug: "harbor-loop",
    title: "Harbor Loop",
    originalTitle: "港のループ",
    developer: "Loop Script",
    releaseDate: "2019",
    status: "playing",
    summary:
      "A route-loop structure placeholder for checking how longer summaries sit beside the large hero image.",
    note: "This can later become a real game entry with route notes, patches, and reading status.",
    cover: {
      src: "/home-rain-harbor.jpg",
      alt: "A rainy harbor used for a looping route placeholder",
      width: 720,
      height: 780,
    },
    tags: ["Loop", "Harbor", "Route"],
    links: [{ href: "https://vndb.org/", label: "VNDB placeholder" }],
  },
];

export function getGameBySlug(slug: string) {
  return gameItems.find((game) => game.slug === slug);
}
