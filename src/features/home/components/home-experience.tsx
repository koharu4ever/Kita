"use client";

import { FloatingVisualNav } from "@/features/home/components/floating-visual-nav";
import { MainVisualNav } from "@/features/home/components/main-visual-nav";
import { RainyWindow } from "@/features/home/components/rainy-window";
import { SceneBackground } from "@/features/home/components/scene-background";
import { VersePanel } from "@/features/home/components/verse-panel";
import { useRotatingIndex } from "@/features/home/hooks/use-rotating-index";
import { useScrollThreshold } from "@/features/home/hooks/use-scroll-threshold";
import type {
  HomeNavItem,
  HomeVerse,
  HomeWallpaper,
} from "@/features/home/types/home";

type HomeExperienceProps = {
  navItems: HomeNavItem[];
  wallpapers: HomeWallpaper[];
  verses: HomeVerse[];
};

export function HomeExperience({
  navItems,
  wallpapers,
  verses,
}: HomeExperienceProps) {
  const activeWallpaperIndex = useRotatingIndex(wallpapers.length, 8500);
  const hasScrolled = useScrollThreshold(0.2);
  const activeWallpaper =
    wallpapers[activeWallpaperIndex] ?? wallpapers.at(0) ?? null;
  const activeVerse =
    verses[activeWallpaperIndex % Math.max(verses.length, 1)] ?? null;

  return (
    <main className="min-h-[200svh] bg-[#05070c] text-white">
      <FloatingVisualNav isVisible={hasScrolled} items={navItems} />

      <section className="fixed inset-0 isolate flex min-h-svh items-end overflow-hidden">
        <SceneBackground
          activeIndex={activeWallpaperIndex}
          wallpapers={wallpapers}
        />
        <div className="absolute inset-0 z-10 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        <MainVisualNav isHidden={hasScrolled} items={navItems} />
      </section>

      <section className="relative z-30 mt-[100svh] min-h-[200svh] overflow-hidden border-t border-white/10 bg-black/45 backdrop-blur-[1px]">
        {activeWallpaper ? (
          <RainyWindow backgroundImageUrl={activeWallpaper.image.url} />
        ) : null}

        <div className="relative z-10 flex min-h-svh items-center justify-center px-6 py-24">
          <VersePanel verse={activeVerse} />
        </div>
      </section>
    </main>
  );
}
