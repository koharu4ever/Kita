"use client";

import { useEffect, useState } from "react";
import { getRainProgress } from "@/features/home/lib/rain-atmosphere";

export function useRainProgress() {
  const [state, setState] = useState({ progress: 0, started: false });
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const progress = getRainProgress(window.scrollY, window.innerHeight);
      setState((previous) => ({
        progress,
        started: previous.started || progress > 0,
      }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return state;
}
