import type { Route } from "next";

import type {
  HomeNavItem,
  HomeVerse,
  HomeWallpaper,
} from "@/features/home/types/home";

export const homeNavItems: HomeNavItem[] = [
  {
    label: "REVIEWS",
    href: "/reviews" as Route,
    mainAccentClassName: "hover:text-purple-500 focus-visible:text-purple-500",
    floatingAccentClassName: "hover:bg-purple-500 focus-visible:bg-purple-500",
  },
  {
    label: "GAMES",
    href: "/games" as Route,
    mainAccentClassName: "hover:text-blue-500 focus-visible:text-blue-500",
    floatingAccentClassName: "hover:bg-blue-500 focus-visible:bg-blue-500",
  },
  {
    label: "TOOLS",
    href: "/tools" as Route,
    mainAccentClassName: "hover:text-green-500 focus-visible:text-green-500",
    floatingAccentClassName: "hover:bg-green-500 focus-visible:bg-green-500",
  },
  {
    label: "ABOUT",
    href: "/about" as Route,
    mainAccentClassName: "hover:text-amber-500 focus-visible:text-amber-500",
    floatingAccentClassName: "hover:bg-amber-500 focus-visible:bg-amber-500",
  },
];

export const homeWallpapers: HomeWallpaper[] = [
  {
    id: "rain-harbor",
    name: "Rain Harbor",
    image: {
      url: "/home-rain-harbor.jpg",
      alt: "Rain drops over a night harbor scene",
    },
  },
  {
    id: "sunset-field",
    name: "Sunset Field",
    image: {
      url: "/home-sunset-field.jpg",
      alt: "A silhouetted figure standing in a sunset field",
    },
  },
  {
    id: "sea-girl",
    name: "Sea Girl",
    image: {
      url: "/home-sea-girl.jpg",
      alt: "A girl walking beside the sea at sunset",
    },
  },
  {
    id: "night-sky",
    name: "Night Sky",
    image: {
      url: "/home-night-sky.jpg",
      alt: "A quiet night sky in deep blue tones",
    },
  },
];

export const homeVerses: HomeVerse[] = [
  {
    id: "window-light",
    text: "The night is quiet enough to hear a page turn.",
    author: "Kita",
  },
  {
    id: "afterimage",
    text: "Some stories stay on the screen after the screen goes dark.",
    author: "Kita",
  },
  {
    id: "save-point",
    text: "A small save point before the next route begins.",
    author: "Kita",
  },
];
