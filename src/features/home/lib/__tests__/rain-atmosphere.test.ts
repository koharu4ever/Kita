import { describe, expect, it } from "vitest";
import { getRainProgress, getWallpaperMix } from "../rain-atmosphere";

describe("home rain atmosphere", () => {
  it("keeps the initial screen dry and clamps overscroll", () => {
    expect(getRainProgress(-100, 1000)).toBe(0);
    expect(getRainProgress(0, 1000)).toBe(0);
    expect(getRainProgress(40, 1000)).toBe(0);
    expect(getRainProgress(5000, 1000)).toBe(1);
    expect(getRainProgress(100, 0)).toBe(0);
  });
  it("reveals water continuously rather than at a section boundary", () => {
    const values = [100, 200, 400, 700, 900].map((y) =>
      getRainProgress(y, 1000),
    );
    expect(values[0]).toBeGreaterThan(0);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(values[2]).toBeGreaterThan(values[1]);
    expect(values[4]).toBe(1);
  });
  it("uses the same viewport-relative progress at different screen sizes", () => {
    expect(getRainProgress(300, 600)).toBe(getRainProgress(600, 1200));
    expect(getRainProgress(Number.NaN, 1000)).toBe(0);
  });
  it("synchronizes wallpaper refraction over the 1800ms crossfade", () => {
    expect(getWallpaperMix(100, 200)).toBe(0);
    expect(getWallpaperMix(1100, 200)).toBe(0.5);
    expect(getWallpaperMix(3000, 200)).toBe(1);
  });
});
