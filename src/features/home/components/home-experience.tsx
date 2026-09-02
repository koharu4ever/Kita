"use client";

import { FloatingVisualNav } from "@/features/home/components/floating-visual-nav";
import { MainVisualNav } from "@/features/home/components/main-visual-nav";
import { RainWaterLayer } from "@/features/home/components/rain-water-layer";
import { SceneBackground } from "@/features/home/components/scene-background";
import { VersePanel } from "@/features/home/components/verse-panel";
import { useRotatingIndex } from "@/features/home/hooks/use-rotating-index";
import { useScrollThreshold } from "@/features/home/hooks/use-scroll-threshold";
import { useRainProgress } from "@/features/home/hooks/use-rain-progress";
import { useWallpaperScene } from "@/features/home/hooks/use-wallpaper-scene";
import { RainSoundControl } from "./rain-sound-control";
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
  const { index: activeWallpaperIndex } = useRotatingIndex(
    wallpapers.length,
    8500,
  );
  const hasScrolled = useScrollThreshold(0.2);
  const { progress: rainProgress, started: rainStarted } = useRainProgress();
  const activeWallpaper =
    wallpapers[activeWallpaperIndex] ?? wallpapers.at(0) ?? null;
  const activeVerse =
    verses[activeWallpaperIndex % Math.max(verses.length, 1)] ?? null;
  const scene = useWallpaperScene(activeWallpaper?.image.url ?? "");

  return (
    <main className="min-h-[240svh] bg-[#05070c] text-white">
      <FloatingVisualNav isVisible={hasScrolled} items={navItems} />
      <RainSoundControl progress={rainProgress} />

      <section className="fixed inset-0 isolate flex min-h-svh items-end overflow-hidden">
        <SceneBackground scene={scene} />
        <RainWaterLayer
          background={scene.background}
          progress={rainProgress}
          started={rainStarted}
        />
        <div className="absolute inset-0 z-10 bg-black/35" />
        <div className="absolute inset-x-0 bottom-0 z-20 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
        <MainVisualNav isHidden={hasScrolled} items={navItems} />
      </section>

      <section className="pointer-events-none relative z-30 pt-[105svh] pb-[35svh]">
        <div className="relative z-10 flex min-h-svh items-center justify-center px-6 py-24">
          <VersePanel verse={activeVerse} />
        </div>
      </section>
    </main>
  );
}
