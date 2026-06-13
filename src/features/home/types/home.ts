import type { Route } from "next";

export type HomeNavItem = {
  label: string;
  href: Route;
  mainAccentClassName: string;
  floatingAccentClassName: string;
};

export type HomeWallpaper = {
  id: string;
  name: string;
  image: {
    url: string;
    alt: string;
  };
};

export type HomeVerse = {
  id: string;
  text: string;
  author?: string;
  source?: string;
};
