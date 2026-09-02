import { loadImages } from "@/features/home/lib/rain-effect/image-loader";
import { RainRenderer } from "@/features/home/lib/rain-effect/rain-renderer";
import { Raindrops } from "@/features/home/lib/rain-effect/raindrops";

// Reuse the existing renderer; Home keeps its independent lifecycle and settings.
export function mountGalleryWindowRain(canvas: HTMLCanvasElement) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false;
  let failed = false;
  let paused = false;
  let visible = false;
  let loading = false;
  let frame = 0;
  let previousTime = 0;
  let size = "";
  let renderer: RainRenderer | null = null;
  let drops: Raindrops | null = null;
  let images: Awaited<ReturnType<typeof loadResources>> | null = null;

  function loadResources() {
    return loadImages({
      city: "/games/window/city.jpg",
      alpha: "/rain-effect/drop-alpha.png",
      color: "/rain-effect/drop-color.png",
      shine: "/rain-effect/drop-shine.png",
    });
  }

  function canRun() {
    return (
      !disposed &&
      !failed &&
      !paused &&
      visible &&
      !document.hidden &&
      !motion.matches
    );
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function fail() {
    failed = true;
    stop();
    renderer?.destroy();
    renderer = null;
    drops = null;
    canvas.style.opacity = "0";
  }

  function tick(now: number) {
    frame = 0;
    if (!canRun() || !renderer || !drops) return;
    // This small decorative window needs at most 30 fps.
    if (now - previousTime >= 1000 / 30) {
      try {
        drops.update(Math.min(1.1, (now - previousTime) / (1000 / 60)));
        renderer.draw();
        previousTime = now;
      } catch {
        fail();
        return;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  function rebuild() {
    if (disposed || failed || !images) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    const nextSize = `${width}x${height}`;
    if (nextSize === size) return;
    stop();
    renderer?.destroy();
    renderer = null;
    size = nextSize;
    canvas.width = width;
    canvas.height = height;
    try {
      drops = new Raindrops(width, height, dpr, images.alpha, images.color, {
        minR: 6,
        maxR: 20,
        maxDrops: 160,
        rainChance: 0.42,
        rainLimit: 2,
        dropletsRate: 2.5,
        dropletsSize: [1.2, 2.5],
        globalTimeScale: 0.9,
        dropFallMultiplier: 0.9,
        trailRate: 0.8,
      });
      renderer = new RainRenderer(
        canvas,
        drops.canvas,
        images.city,
        images.shine,
        {
          minRefraction: 90 * dpr,
          maxRefraction: 180 * dpr,
          brightness: 1.1,
          renderShadow: true,
          alphaMultiply: 8,
          alphaSubtract: 2.5,
          parallaxFg: 0,
          parallaxBg: 0,
        },
      );
      renderer.setBackground({
        image: images.city,
        previousImage: images.city,
        startedAt: 0,
      });
      // Pre-wet the pane so the rain is visible as soon as the images load.
      for (let index = 0; index < 180; index += 1) drops.update(1);
      renderer.draw();
      canvas.style.opacity = "0.96";
    } catch {
      fail();
    }
  }

  function sync() {
    if (!canRun()) {
      stop();
      if (motion.matches) canvas.style.opacity = "0";
      return;
    }
    if (!images) {
      if (loading) return;
      loading = true;
      void loadResources()
        .then((loaded) => {
          if (disposed) return;
          images = loaded;
          loading = false;
          sync();
        })
        .catch(() => {
          if (!disposed) fail();
        });
      return;
    }
    rebuild();
    if (renderer && !frame && !failed) {
      canvas.style.opacity = "0.96";
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const resize = new ResizeObserver(() => {
    if (canRun()) {
      rebuild();
      sync();
    }
  });
  const contextLost = (event: Event) => {
    event.preventDefault();
    fail();
  };
  intersection.observe(canvas);
  resize.observe(canvas);
  motion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  canvas.addEventListener("webglcontextlost", contextLost);

  return {
    setPaused(value: boolean) {
      paused = value;
      sync();
    },
    destroy() {
      disposed = true;
      stop();
      intersection.disconnect();
      resize.disconnect();
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", contextLost);
      renderer?.destroy();
      renderer = null;
      drops = null;
      images = null;
    },
  };
}
