import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadImages: vi.fn(),
  draw: vi.fn(),
  destroy: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@/features/home/lib/rain-effect/image-loader", () => ({
  loadImages: mocks.loadImages,
}));
vi.mock("@/features/home/lib/rain-effect/rain-renderer", () => ({
  RainRenderer: class {
    setBackground() {}
    draw = mocks.draw;
    destroy = mocks.destroy;
  },
}));
vi.mock("@/features/home/lib/rain-effect/raindrops", () => ({
  Raindrops: class {
    canvas = {};
    update = mocks.update;
  },
}));

import { mountGalleryWindowRain } from "@/features/games/lib/gallery-window-rain";

describe("Gallery window rain lifecycle", () => {
  let motion: EventTarget & { matches: boolean };
  let doc: EventTarget & { hidden: boolean };
  let canvas: HTMLCanvasElement;
  let intersection: (entries: { isIntersecting: boolean }[]) => void;
  let frames: Map<number, FrameRequestCallback>;
  let serial: number;
  let rain: ReturnType<typeof mountGalleryWindowRain> | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.loadImages.mockResolvedValue({
      city: {},
      alpha: {},
      color: {},
      shine: {},
    });
    motion = Object.assign(new EventTarget(), { matches: false });
    doc = Object.assign(new EventTarget(), { hidden: false });
    frames = new Map();
    serial = 0;
    canvas = Object.assign(new EventTarget(), {
      style: { opacity: "0" },
      width: 0,
      height: 0,
      getBoundingClientRect: () => ({ width: 400, height: 560 }),
    }) as unknown as HTMLCanvasElement;
    vi.stubGlobal("matchMedia", () => motion);
    vi.stubGlobal("document", doc);
    vi.stubGlobal("devicePixelRatio", 2);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++serial, callback);
      return serial;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof intersection) {
          intersection = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    rain?.destroy();
    rain = undefined;
    vi.unstubAllGlobals();
  });

  async function show() {
    intersection([{ isIntersecting: true }]);
    await Promise.resolve();
    await Promise.resolve();
  }

  it("waits until visible, caps pixel density, freezes/resumes without rebuilding", async () => {
    rain = mountGalleryWindowRain(canvas);
    expect(mocks.loadImages).not.toHaveBeenCalled();
    await show();
    expect(canvas.width).toBe(700);
    expect(canvas.style.opacity).toBe("0.96");
    expect(mocks.update).toHaveBeenCalledTimes(180);
    expect(frames.size).toBe(1);
    rain.setPaused(true);
    expect(frames.size).toBe(0);
    expect(mocks.destroy).not.toHaveBeenCalled();
    rain.setPaused(false);
    expect(frames.size).toBe(1);
    expect(mocks.loadImages).toHaveBeenCalledTimes(1);
  });

  it("does not initialize for reduced motion, stops offscreen and in background", async () => {
    motion.matches = true;
    rain = mountGalleryWindowRain(canvas);
    await show();
    expect(mocks.loadImages).not.toHaveBeenCalled();
    motion.matches = false;
    motion.dispatchEvent(new Event("change"));
    await show();
    expect(frames.size).toBe(1);
    doc.hidden = true;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    doc.hidden = false;
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(frames.size).toBe(1);
    intersection([{ isIntersecting: false }]);
    expect(frames.size).toBe(0);
  });

  it("does not start after unmount while images are loading", async () => {
    let resolve!: (images: Record<string, unknown>) => void;
    mocks.loadImages.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    rain = mountGalleryWindowRain(canvas);
    intersection([{ isIntersecting: true }]);
    rain.destroy();
    rain = undefined;
    resolve({ city: {}, alpha: {}, color: {}, shine: {} });
    await Promise.resolve();
    expect(frames.size).toBe(0);
    expect(mocks.draw).not.toHaveBeenCalled();
  });

  it("falls back to still layers after WebGL context loss", async () => {
    rain = mountGalleryWindowRain(canvas);
    await show();
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    expect(frames.size).toBe(0);
    expect(canvas.style.opacity).toBe("0");
    expect(mocks.destroy).toHaveBeenCalledTimes(1);
    rain.setPaused(false);
    expect(frames.size).toBe(0);
  });
});
