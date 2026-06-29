"use client";

import { useEffect, useRef, useState } from "react";

import { loadImages } from "@/features/home/lib/rain-effect/image-loader";
import { RainRenderer } from "@/features/home/lib/rain-effect/rain-renderer";
import {
  Raindrops,
  type RaindropsOptions,
} from "@/features/home/lib/rain-effect/raindrops";

type RainIntensity = "drizzle" | "rain" | "storm";

type RainWaterLayerProps = {
  backgroundImageUrl: string;
  intensity?: RainIntensity;
};

type RainScene = {
  destroy: () => void;
};

const dropTextures = {
  dropAlpha: "/rain-effect/drop-alpha.png",
  dropColor: "/rain-effect/drop-color.png",
  dropShine: "/rain-effect/drop-shine.png",
};

const desktopRainMediaQuery =
  "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const reducedMotionMediaQuery = "(prefers-reduced-motion: reduce)";

const intensityOptions: Record<RainIntensity, Partial<RaindropsOptions>> = {
  drizzle: {
    minR: 7,
    maxR: 24,
    maxDrops: 320,
    rainChance: 0.1,
    rainLimit: 2,
    dropletsRate: 10,
    trailRate: 0.75,
  },
  rain: {
    minR: 8,
    maxR: 34,
    maxDrops: 420,
    rainChance: 0.18,
    rainLimit: 3,
    dropletsRate: 18,
    trailRate: 1,
  },
  storm: {
    minR: 10,
    maxR: 42,
    maxDrops: 520,
    rainChance: 0.26,
    rainLimit: 4,
    dropletsRate: 26,
    trailRate: 1.5,
  },
};

function getCanvasSize(container: HTMLDivElement) {
  const rect = container.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  return {
    cssHeight: Math.max(1, rect.height),
    cssWidth: Math.max(1, rect.width),
    dpr,
    height: Math.max(1, Math.floor(rect.height * dpr)),
    width: Math.max(1, Math.floor(rect.width * dpr)),
  };
}

async function createRainScene({
  backgroundImageUrl,
  canvas,
  container,
  intensity,
}: {
  backgroundImageUrl: string;
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  intensity: RainIntensity;
}): Promise<RainScene> {
  const { cssHeight, cssWidth, dpr, height, width } = getCanvasSize(container);

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const { backgroundImage, dropAlpha, dropColor, dropShine } = await loadImages(
    {
      ...dropTextures,
      backgroundImage: backgroundImageUrl,
    },
  );

  const raindrops = new Raindrops(width, height, dpr, dropAlpha, dropColor, {
    ...intensityOptions[intensity],
  });
  const renderer = new RainRenderer(
    canvas,
    raindrops.canvas,
    backgroundImage,
    dropShine,
    {
      alphaMultiply: intensity === "drizzle" ? 5 : 6,
      alphaSubtract: intensity === "storm" ? 2.7 : 3,
      maxRefraction: intensity === "storm" ? 470 : 420,
      minRefraction: intensity === "drizzle" ? 110 : 140,
    },
  );

  let animationFrame = 0;
  let destroyed = false;
  let lastFrame = performance.now();
  const parallax = { x: 0, y: 0 };

  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    parallax.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    parallax.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };

  const tick = (time: number) => {
    if (destroyed) {
      return;
    }

    const delta = time - lastFrame;
    lastFrame = time;

    if (document.visibilityState === "visible") {
      raindrops.update(delta / (1000 / 60));
      renderer.setParallax(parallax.x, parallax.y);
      renderer.draw();
    }

    animationFrame = window.requestAnimationFrame(tick);
  };

  container.addEventListener("pointermove", handlePointerMove);
  animationFrame = window.requestAnimationFrame(tick);

  return {
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      container.removeEventListener("pointermove", handlePointerMove);
      renderer.destroy();
    },
  };
}

export function RainWaterLayer({
  backgroundImageUrl,
  intensity = "rain",
}: RainWaterLayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRainEnabled, setIsRainEnabled] = useState(false);
  const [isFallbackVisible, setIsFallbackVisible] = useState(false);

  useEffect(() => {
    const desktopRainMedia = window.matchMedia(desktopRainMediaQuery);
    const reducedMotionMedia = window.matchMedia(reducedMotionMediaQuery);
    const updateRainCapability = () => {
      setIsRainEnabled(desktopRainMedia.matches && !reducedMotionMedia.matches);
    };

    updateRainCapability();
    desktopRainMedia.addEventListener("change", updateRainCapability);
    reducedMotionMedia.addEventListener("change", updateRainCapability);

    return () => {
      desktopRainMedia.removeEventListener("change", updateRainCapability);
      reducedMotionMedia.removeEventListener("change", updateRainCapability);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas || !isRainEnabled) {
      setIsFallbackVisible(true);
      return;
    }

    let disposed = false;
    let scene: RainScene | null = null;
    let resizeTimeout = 0;

    const start = async () => {
      scene?.destroy();
      scene = null;

      try {
        const nextScene = await createRainScene({
          backgroundImageUrl,
          canvas,
          container,
          intensity,
        });

        if (disposed) {
          nextScene.destroy();
          return;
        }

        scene = nextScene;
        setIsFallbackVisible(false);
      } catch {
        setIsFallbackVisible(true);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(start, 160);
    });

    resizeObserver.observe(container);
    void start();

    return () => {
      disposed = true;
      window.clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      scene?.destroy();
    };
  }, [backgroundImageUrl, intensity, isRainEnabled]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      ref={containerRef}
    >
      <canvas
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          isRainEnabled && !isFallbackVisible ? "opacity-90" : "opacity-0"
        }`}
        ref={canvasRef}
      />
      {isFallbackVisible ? (
        <div className="absolute inset-0 bg-white/[0.03] backdrop-blur-[1px]" />
      ) : null}
    </div>
  );
}
