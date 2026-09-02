"use client";

import { useEffect, useRef, useState } from "react";
import { loadImages } from "@/features/home/lib/rain-effect/image-loader";
import { RainRenderer } from "@/features/home/lib/rain-effect/rain-renderer";
import { Raindrops } from "@/features/home/lib/rain-effect/raindrops";
import {
  getWallpaperMix,
  type RainBackground,
} from "@/features/home/lib/rain-atmosphere";
import styles from "./home-atmosphere.module.css";

type RainEngine = {
  update: (background: RainBackground, progress: number) => void;
  destroy: () => void;
};

export function RainWaterLayer({
  background,
  progress,
  started,
}: {
  background: RainBackground | null;
  progress: number;
  started: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ background, progress });
  const engineRef = useRef<RainEngine | null>(null);
  const [capable, setCapable] = useState(false);
  const [ready, setReady] = useState(false);
  const enabled = capable && started && background !== null;

  useEffect(() => {
    const media = matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setCapable(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    latest.current = { background, progress };
    if (background) engineRef.current?.update(background, progress);
  }, [background, progress]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!enabled || !container || !canvas) return;
    let disposed = false;
    let resizeTimer = 0;
    let observer: ResizeObserver | null = null;
    let stop: (() => void) | null = null;

    void loadImages({
      alpha: "/rain-effect/drop-alpha.png",
      color: "/rain-effect/drop-color.png",
      shine: "/rain-effect/drop-shine.png",
    })
      .then(({ alpha, color, shine }) => {
        if (disposed) return;
        let lastSize = "";
        const rebuild = () => {
          if (disposed || !latest.current.background) return;
          const rect = container.getBoundingClientRect();
          const dpr = Math.min(devicePixelRatio || 1, 1.5);
          const width = Math.max(1, Math.round(rect.width * dpr));
          const height = Math.max(1, Math.round(rect.height * dpr));
          const size = width + "x" + height;
          if (size === lastSize) return;
          lastSize = size;
          stop?.();
          canvas.width = width;
          canvas.height = height;
          const drops = new Raindrops(width, height, dpr, alpha, color, {
            minR: 7,
            maxR: 28,
            maxDrops: 240,
            dropletsRate: 4,
            dropletsSize: [1, 2.5],
            globalTimeScale: 0.75,
            trailRate: 0.7,
          });
          const renderer = new RainRenderer(
            canvas,
            drops.canvas,
            latest.current.background.image,
            shine,
            {
              minRefraction: 80 * dpr,
              maxRefraction: 220 * dpr,
              brightness: 1,
              parallaxFg: 0,
              parallaxBg: 0,
            },
          );
          let currentBackground = latest.current.background;
          let wetness = latest.current.progress;
          let frame = 0;
          let previousTime = performance.now();
          let destroyed = false;
          renderer.setBackground(currentBackground);
          const tick = (now: number) => {
            frame = 0;
            if (destroyed || document.hidden || wetness <= 0) return;
            drops.update(Math.min(1.1, (now - previousTime) / (1000 / 60)));
            previousTime = now;
            renderer.draw(getWallpaperMix(now, currentBackground.startedAt));
            frame = requestAnimationFrame(tick);
          };
          const schedule = () => {
            if (!frame && !destroyed && !document.hidden && wetness > 0) {
              previousTime = performance.now();
              frame = requestAnimationFrame(tick);
            }
          };
          const visibility = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            schedule();
          };
          const engine: RainEngine = {
            update(nextBackground, nextProgress) {
              if (currentBackground !== nextBackground) {
                currentBackground = nextBackground;
                renderer.setBackground(nextBackground);
              }
              wetness = nextProgress;
              drops.options.raining = wetness > 0;
              drops.options.rainChance = 0.025 + wetness * 0.15;
              drops.options.rainLimit = 1 + wetness * 2;
              drops.options.dropletsRate = 1 + wetness * 5;
              schedule();
            },
            destroy() {
              destroyed = true;
              cancelAnimationFrame(frame);
              document.removeEventListener("visibilitychange", visibility);
              renderer.destroy();
            },
          };
          document.addEventListener("visibilitychange", visibility);
          engineRef.current = engine;
          stop = () => {
            engine.destroy();
            engineRef.current = null;
          };
          engine.update(currentBackground, wetness);
          setReady(true);
        };
        const safeRebuild = () => {
          try {
            rebuild();
          } catch {
            stop?.();
            setReady(false);
          }
        };
        observer = new ResizeObserver(() => {
          clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(safeRebuild, 160);
        });
        observer.observe(container);
        safeRebuild();
      })
      .catch(() => {
        if (!disposed) setReady(false);
      });

    const lostContext = (event: Event) => {
      event.preventDefault();
      stop?.();
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", lostContext);
    return () => {
      disposed = true;
      clearTimeout(resizeTimer);
      observer?.disconnect();
      stop?.();
      canvas.removeEventListener("webglcontextlost", lostContext);
    };
  }, [enabled]);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className={styles.rain}
      style={{ opacity: capable && ready ? progress * 0.92 : 0 }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
