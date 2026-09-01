"use client";

import { useEffect, useState } from "react";

export function useRotatingIndex(length: number, intervalMs: number) {
  const [rotation, setRotation] = useState({
    index: 0,
    hasRotated: false,
  });

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;

    const updateRotation = () => {
      window.clearInterval(timer);

      if (reducedMotion.matches) {
        setRotation({ index: 0, hasRotated: false });
        return;
      }

      timer = window.setInterval(() => {
        setRotation((current) => ({
          index: (current.index + 1) % length,
          hasRotated: true,
        }));
      }, intervalMs);
    };

    updateRotation();
    reducedMotion.addEventListener("change", updateRotation);

    return () => {
      window.clearInterval(timer);
      reducedMotion.removeEventListener("change", updateRotation);
    };
  }, [intervalMs, length]);

  if (length <= 1) {
    return { index: 0, hasRotated: false };
  }

  return {
    index: rotation.index % length,
    hasRotated: rotation.hasRotated,
  };
}
