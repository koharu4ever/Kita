export type GamePreview = {
  slug: string;
  title: string;
  developer: string;
  releaseDate: string;
  coverImage: string;
  status: "planned" | "playing" | "finished";
  tags: string[];
};

export const gameItems: GamePreview[] = [
  {
    slug: "sea-side-fragment",
    title: "Sea Side Fragment",
    developer: "Placeholder Studio",
    releaseDate: "2024",
    coverImage: "/home-sea-girl.jpg",
    status: "playing",
    tags: ["Summer", "Drama"],
  },
  {
    slug: "night-archive",
    title: "Night Archive",
    developer: "Kita Works",
    releaseDate: "2023",
    coverImage: "/home-night-sky.jpg",
    status: "finished",
    tags: ["Mystery", "Atmosphere"],
  },
  {
    slug: "after-rain",
    title: "After Rain",
    developer: "Rain Window",
    releaseDate: "2022",
    coverImage: "/home-rain-harbor.jpg",
    status: "planned",
    tags: ["Memory", "Urban"],
  },
  {
    slug: "sunset-field",
    title: "Sunset Field",
    developer: "Orange Hour",
    releaseDate: "2021",
    coverImage: "/home-sunset-field.jpg",
    status: "finished",
    tags: ["Slice of Life", "Ending"],
  },
];
