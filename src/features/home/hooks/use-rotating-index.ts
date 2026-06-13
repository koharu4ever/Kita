"use client";

import { useEffect, useState } from "react";

export function useRotatingIndex(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, length]);

  if (length <= 1) {
    return 0;
  }

  return index % length;
}
