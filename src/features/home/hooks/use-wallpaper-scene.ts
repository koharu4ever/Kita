"use client";

import { useEffect, useState } from "react";
import { loadImage } from "@/features/home/lib/rain-effect/image-loader";
import type { WallpaperScene } from "@/features/home/lib/rain-atmosphere";

export function useWallpaperScene(url: string) {
  const [scene, setScene] = useState<WallpaperScene>({
    url,
    previousUrl: null,
    background: null,
  });
  useEffect(() => {
    let cancelled = false;
    if (!url) return;
    // Both renderers use the same decoded image; wallpaper changes do not reset water.
    void loadImage(url)
      .then((image) => {
        if (cancelled) return;
        setScene((previous) => ({
          url,
          previousUrl: previous.background ? previous.url : null,
          background: {
            image,
            previousImage: previous.background?.image ?? image,
            startedAt: performance.now(),
          },
        }));
      })
      .catch(() => {
        // Keep the last working scene when the next image cannot load.
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return scene;
}
