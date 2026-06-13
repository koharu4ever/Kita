import {
  homeNavItems,
  homeVerses,
  homeWallpapers,
} from "@/features/home/data/home-content";

import { HomeExperience } from "./home-experience";

export function HomePage() {
  return (
    <HomeExperience
      navItems={homeNavItems}
      verses={homeVerses}
      wallpapers={homeWallpapers}
    />
  );
}
