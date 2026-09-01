import type { Route } from "next";

import type {
  HomeNavItem,
  HomeVerse,
  HomeWallpaper,
} from "@/features/home/types/home";

export const homeNavItems: HomeNavItem[] = [
  {
    label: "GAMES",
    href: "/games" as Route,
    mainAccentClassName: "hover:text-blue-500 focus-visible:text-blue-500",
    floatingAccentClassName: "hover:bg-blue-500 focus-visible:bg-blue-500",
  },
  {
    label: "REVIEWS",
    href: "/reviews" as Route,
    mainAccentClassName: "hover:text-purple-500 focus-visible:text-purple-500",
    floatingAccentClassName: "hover:bg-purple-500 focus-visible:bg-purple-500",
  },
  {
    label: "ABOUT",
    href: "/about" as Route,
    mainAccentClassName: "hover:text-amber-500 focus-visible:text-amber-500",
    floatingAccentClassName: "hover:bg-amber-500 focus-visible:bg-amber-500",
  },
  {
    label: "TOOLS",
    href: "/tools" as Route,
    mainAccentClassName: "hover:text-green-500 focus-visible:text-green-500",
    floatingAccentClassName: "hover:bg-green-500 focus-visible:bg-green-500",
  },
];

export const homeWallpapers: HomeWallpaper[] = [
  {
    id: "cover",
    name: "Rain Window",
    image: {
      url: "/cover.webp",
      alt: "A rain-streaked window overlooking a coastal city at blue hour",
    },
  },
  {
    id: "rain-harbor",
    name: "Rain Harbor",
    image: {
      url: "/home-rain-harbor.webp",
      alt: "A quiet harbor reflecting distant lights after rainfall",
    },
  },
  {
    id: "sunset-field",
    name: "Sunset Field",
    image: {
      url: "/home-sunset-field.webp",
      alt: "An open field beneath a violet and amber sunset",
    },
  },
  {
    id: "quiet-shore",
    name: "Quiet Shore",
    image: {
      url: "/home-sea-girl.webp",
      alt: "An empty shoreline beneath storm clouds at twilight",
    },
  },
  {
    id: "night-sky",
    name: "Night Sky",
    image: {
      url: "/home-night-sky.webp",
      alt: "A starry night above distant lights reflected on dark water",
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
