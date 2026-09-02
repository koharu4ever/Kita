export const wallpaperFadeMs = 1800;

export function clampUnit(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

// Begin before the next section enters; there is no moving edge to reveal.
export function getRainProgress(scrollY: number, viewportHeight: number) {
  if (viewportHeight <= 0) return 0;
  const value = clampUnit((scrollY / viewportHeight - 0.04) / 0.86);
  return value * value * (3 - 2 * value);
}

export function getWallpaperMix(now: number, startedAt: number) {
  return clampUnit((now - startedAt) / wallpaperFadeMs);
}

export type RainBackground = {
  image: HTMLImageElement;
  previousImage: HTMLImageElement;
  startedAt: number;
};

export type WallpaperScene = {
  url: string;
  previousUrl: string | null;
  background: RainBackground | null;
};
